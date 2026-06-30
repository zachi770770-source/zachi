/**
 * SupabaseMemoryService — מימוש Supabase של memoryService.
 * משמש כשמשתמש מחובר.
 *
 * Note: כל הפעולות הללו רצות בצד שרת או מהקליינט עם anon key + auth session.
 * RLS דואג שהמשתמש יראה רק את הנתונים שלו.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IMemoryService, UserMemory } from "./memoryService";
import type {
  CatchEntry,
  DiagnosisResult,
  ToolUsageEntry,
  VoiceKey,
} from "@/types";
import type { MemoryCard } from "@/types/ai";

export class SupabaseMemoryService implements IMemoryService {
  constructor(private client: SupabaseClient) {}

  async load(userId: string | null): Promise<UserMemory> {
    if (!userId) return emptyMemory();

    const [diagnoses, toolUsage, conversations, profile] = await Promise.all([
      this.client
        .from("diagnoses")
        .select("*")
        .eq("user_id", userId)
        .order("taken_at", { ascending: false })
        .limit(20),
      this.client
        .from("tool_usage")
        .select("*")
        .eq("user_id", userId)
        .order("used_at", { ascending: false })
        .limit(50),
      this.client
        .from("conversations")
        .select("id, intent, summary, updated_at")
        .eq("user_id", userId)
        .not("summary", "is", null)
        .order("updated_at", { ascending: false })
        .limit(5),
      this.client
        .from("user_profiles")
        .select("segment")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    return {
      segment: profile.data?.segment,
      diagnoses: (diagnoses.data ?? []).map((d) => ({
        takenAt: d.taken_at,
        segment: d.segment,
        scores: d.scores,
        dominantVoice: d.dominant_voice as VoiceKey,
        recommendedToolSlugs: [],
        recommendedStationId: 1,
      })),
      toolUsage: (toolUsage.data ?? []).map((t) => ({
        toolSlug: t.tool_slug,
        values: t.result_json?.values ?? {},
        reflection: t.result_json?.reflection ?? "",
        caughtDriverWhen: t.caught_driver_when ?? undefined,
        timestamp: t.used_at,
      })),
      catches: [],
      maintenance: [],
      goals: [],
      completedStations: [],
    };
  }

  async saveDiagnosis(userId: string | null, d: DiagnosisResult): Promise<void> {
    if (!userId) return;
    await this.client.from("diagnoses").insert({
      user_id: userId,
      segment: d.segment,
      scores: d.scores,
      dominant_voice: d.dominantVoice,
      taken_at: d.takenAt,
    });
  }

  async saveToolUsage(
    userId: string | null,
    u: ToolUsageEntry,
  ): Promise<void> {
    if (!userId) return;
    await this.client.from("tool_usage").insert({
      user_id: userId,
      tool_slug: u.toolSlug,
      caught_driver_when: u.caughtDriverWhen ?? null,
      result_json: { values: u.values, reflection: u.reflection },
      used_at: u.timestamp,
    });
  }

  async saveCatch(userId: string | null, c: CatchEntry): Promise<void> {
    if (!userId) return;
    await this.client.from("patterns").insert({
      user_id: userId,
      pattern_key: c.voice,
      source: "tool",
      evidence: c.note ?? null,
      noted_at: c.timestamp,
    });
  }

  async buildCardFor(userId: string | null): Promise<MemoryCard> {
    const memory = await this.load(userId);
    const latest = memory.diagnoses[0];
    return {
      segment: memory.segment,
      daysSinceDiagnosis: latest
        ? Math.floor(
            (Date.now() - new Date(latest.takenAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : undefined,
      dominantVoice: latest?.dominantVoice,
      recentPatterns: [],
      practicedToolSlugs: Array.from(
        new Set(memory.toolUsage.slice(0, 20).map((u) => u.toolSlug)),
      ).slice(0, 5),
      recentSummaries: [],
    };
  }

  async reset(userId: string | null): Promise<void> {
    if (!userId) return;
    // RLS מבטיח שזה ימחק רק את הנתונים של המשתמש הזה
    await Promise.all([
      this.client.from("diagnoses").delete().eq("user_id", userId),
      this.client.from("tool_usage").delete().eq("user_id", userId),
      this.client.from("patterns").delete().eq("user_id", userId),
      this.client.from("conversations").delete().eq("user_id", userId),
      this.client.from("memory_cards").delete().eq("user_id", userId),
      this.client.from("goals").delete().eq("user_id", userId),
    ]);
  }
}

function emptyMemory(): UserMemory {
  return {
    diagnoses: [],
    toolUsage: [],
    catches: [],
    maintenance: [],
    goals: [],
    completedStations: [],
  };
}
