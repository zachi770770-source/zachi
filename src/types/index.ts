// ===== Core domain types =====

export type UserSegment =
  | "dating"
  | "new_relationship"
  | "long_term"
  | "after_breakup"
  | "second_chapter";

export type VoiceKey =
  | "approval"   // הצורך באישור
  | "avoidance"  // הפחד מקרבה
  | "pleasing"   // ההרגל לרצות
  | "rescuer"    // הצורך להציל
  | "clinging";  // ההיאחזות

export interface VoiceMeta {
  key: VoiceKey;
  name: string;
  shortName: string;
  description: string;
  whatItGave: string;
  whatItCosts: string;
  chapterRef: string;
}

export interface Station {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  centralQuestion: string;
  risk: string;
  summary: string;
  insight: string;
  reflectionQuestions: string[];
  weeklyExercise: string;
  relatedToolSlugs: string[];
  chapterIntro: string;
  chapterContent: string;
}

export type ToolTier = "free" | "premium";
export type ToolCategory = "diagnosis" | "decision" | "communication" | "emergency" | "growth";

export interface ToolField {
  id: string;
  label: string;
  helper?: string;
  type: "textarea" | "input" | "slider" | "choice" | "checklist";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  rangeLabels?: [string, string];
}

export interface Tool {
  slug: string;
  title: string;
  shortName?: string;
  tagline: string;
  whenToUse: string;
  chapterSource: string;
  category: ToolCategory;
  tier: ToolTier;
  bookExcerpt: string;        // קצר, ≤25 מילים, או פרפרזה
  voiceTags: VoiceKey[];
  fields: ToolField[];
  resultIntro: string;
  resultBuilder: (
    values: Record<string, string | number>,
  ) => { reflection: string; nextStep: string; nextToolSlug?: string };
}

export interface DiagnosisQuestion {
  id: string;
  text: string;
  voice: VoiceKey;
  reverse?: boolean; // ציון גבוה = בריא
}

export interface DiagnosisResult {
  takenAt: string; // ISO
  segment: UserSegment;
  scores: Record<VoiceKey, number>; // 1-5
  dominantVoice: VoiceKey;
  recommendedToolSlugs: string[];
  recommendedStationId: number;
}

export interface CatchEntry {
  id: string;
  when: "before" | "during" | "after";
  voice: VoiceKey;
  note?: string;
  timestamp: string;
}

export interface ToolUsageEntry {
  toolSlug: string;
  values: Record<string, string | number>;
  reflection: string;
  caughtDriverWhen?: "before" | "during" | "after";
  timestamp: string;
}

export interface MaintenanceSession {
  id: string;
  whatWorked: string;
  overload: string;
  fixThisWeek: string;
  timestamp: string;
}

export interface Goal {
  id: string;
  text: string;
  source: "diagnosis" | "coach" | "tool";
  setAt: string;
  doneAt?: string;
}

// ===== Coach (AI) =====

export type CoachIntent =
  | "situation"
  | "date"
  | "journal"
  | "plan"
  | "conversation";

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  intent?: CoachIntent;
  toolSuggestionSlug?: string;
  timestamp: string;
}

export interface CoachResponse {
  facts: string;
  story: string;
  nextAction: string;
  toolSuggestion?: { slug: string; reason: string };
  safetyTriggered?: boolean;
}

// ===== Premium / Entitlements =====

export type Plan = "free" | "premium";

export type Feature =
  | "coach.unlimited"
  | "coach.journal"
  | "tools.advanced"
  | "diagnosis.history"
  | "maintenance.partner"
  | "learn.all_stations";

export interface Entitlement {
  plan: Plan;
  features: Partial<Record<Feature, boolean | number>>;
}
