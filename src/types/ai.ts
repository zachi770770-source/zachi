// Re-export Coach types from main types file
export type {
  CoachIntent,
  CoachMessage,
  CoachResponse,
  VoiceKey,
} from "@/types";

// Memory Card — מבנה שיוטמע ב־Phase 2 ב־Supabase.
// כרגע מיוצר on-the-fly מ־localStorage state.
export interface MemoryCard {
  segment?: string;
  daysSinceDiagnosis?: number;
  dominantVoice?: string;
  recentPatterns: string[];
  practicedToolSlugs: string[];
  recentSummaries: string[];
}
