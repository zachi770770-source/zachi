/** Relationship stages used across the app. */
export const RELATIONSHIP_STAGES = [
  "לפני קשר",
  "דייטים",
  "קשר מתהווה",
  "קשר קיים",
  "אחרי ריב",
] as const;

export type RelationshipStage = (typeof RELATIONSHIP_STAGES)[number];

/** Canonical tool identifiers (slugs) stored in the database. */
export type ToolSlug =
  | "fact-story-action"
  | "three-gates"
  | "safe-silence"
  | "maintenance-20"
  | "72-hours";

export interface Profile {
  id: string;
  full_name: string | null;
  relationship_stage: string | null;
  created_at: string;
}

export interface Situation {
  id: string;
  user_id: string;
  title: string;
  content: string;
  relationship_stage: string | null;
  emotional_intensity: number | null;
  suggested_tool: string | null;
  created_at: string;
}

export interface ToolEntry {
  id: string;
  user_id: string;
  tool_name: ToolSlug | string;
  data: Record<string, unknown>;
  summary: string | null;
  created_at: string;
}

export interface WeeklyMaintenance {
  id: string;
  user_id: string;
  week_start: string;
  checklist: Record<string, boolean>;
  reflection: string | null;
  created_at: string;
}

/** A unified journal item — situations and tool entries merged for display. */
export type JournalKind = "situation" | "tool";

export interface JournalItem {
  id: string;
  kind: JournalKind;
  title: string;
  subtitle: string | null;
  relationship_stage: string | null;
  tool_name: string | null;
  created_at: string;
}
