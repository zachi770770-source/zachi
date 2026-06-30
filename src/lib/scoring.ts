import { DIAGNOSIS_QUESTIONS, SEGMENT_OPTIONS } from "@/content/questions";
import { TOOLS } from "@/content/tools";
import { VOICE_KEYS } from "@/content/voices";
import type { DiagnosisResult, UserSegment, VoiceKey } from "@/types";

// מחשב ציון 1-5 לכל קול לפי תשובות (ב־reverse questions הופך את הציון).
export function scoreDiagnosis(
  answers: Record<string, number>,
  segment: UserSegment,
): DiagnosisResult {
  const sums: Record<VoiceKey, { total: number; count: number }> = {
    approval: { total: 0, count: 0 },
    avoidance: { total: 0, count: 0 },
    pleasing: { total: 0, count: 0 },
    rescuer: { total: 0, count: 0 },
    clinging: { total: 0, count: 0 },
  };

  for (const q of DIAGNOSIS_QUESTIONS) {
    const raw = answers[q.id];
    if (raw === undefined) continue;
    const value = q.reverse ? 6 - raw : raw; // reverse: 5 = healthy, becomes 1 (low voice)
    sums[q.voice].total += value;
    sums[q.voice].count += 1;
  }

  const scores: Record<VoiceKey, number> = {
    approval: 0,
    avoidance: 0,
    pleasing: 0,
    rescuer: 0,
    clinging: 0,
  };
  for (const k of VOICE_KEYS) {
    scores[k] = sums[k].count === 0 ? 0 : sums[k].total / sums[k].count;
  }

  const dominant = (Object.entries(scores) as [VoiceKey, number][]).reduce(
    (best, cur) => (cur[1] > best[1] ? cur : best),
    ["approval", 0] as [VoiceKey, number],
  )[0];

  const recommendedToolSlugs = TOOLS.filter((t) => t.voiceTags.includes(dominant))
    .slice(0, 3)
    .map((t) => t.slug);

  const stationFromSegment =
    SEGMENT_OPTIONS.find((s) => s.key === segment)?.recommendedStation ?? 1;

  return {
    takenAt: new Date().toISOString(),
    segment,
    scores,
    dominantVoice: dominant,
    recommendedToolSlugs,
    recommendedStationId: stationFromSegment,
  };
}
