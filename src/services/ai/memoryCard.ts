import type { MemoryCard } from "@/types/ai";
import type {
  DiagnosisResult,
  ToolUsageEntry,
  CatchEntry,
} from "@/types";

export interface AppStateSnapshot {
  segment?: string | null;
  diagnosisHistory: DiagnosisResult[];
  toolUsage: ToolUsageEntry[];
  catches: CatchEntry[];
}

// בונה Memory Card מצומצם מהמצב הנוכחי ב־localStorage.
// ב־Phase 2 זה יוחלף ב־summarizer אמיתי שמדבר עם Supabase.
export function buildMemoryCard(state: AppStateSnapshot): MemoryCard {
  const latest = state.diagnosisHistory[0];
  const daysSinceDiagnosis = latest
    ? Math.floor(
        (Date.now() - new Date(latest.takenAt).getTime()) / (1000 * 60 * 60 * 24),
      )
    : undefined;

  const practicedToolSlugs = Array.from(
    new Set(state.toolUsage.slice(0, 20).map((u) => u.toolSlug)),
  ).slice(0, 5);

  const recentPatterns = Array.from(
    new Set(state.catches.slice(0, 10).map((c) => c.voice)),
  ).slice(0, 3);

  return {
    segment: state.segment ?? undefined,
    daysSinceDiagnosis,
    dominantVoice: latest?.dominantVoice,
    recentPatterns,
    practicedToolSlugs,
    recentSummaries: [],
  };
}
