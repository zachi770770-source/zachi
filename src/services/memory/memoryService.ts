/**
 * memoryService — ניהול הזיכרון של "המאמן".
 *
 * Phase 2 hybrid mode:
 *   - אם המשתמש Guest (אין session) → קורא ממה שיש ב-localStorage (אותה לוגיקה כמו ב-Phase 1).
 *   - אם המשתמש מחובר → סינכרון דו־כיווני עם Supabase.
 *
 * ה-API הזה מספק interface אחיד לקריאה ולכתיבה — לא משנה מאיפה ה-data בא.
 */

import type {
  DiagnosisResult,
  ToolUsageEntry,
  CatchEntry,
  MaintenanceSession,
  Goal,
} from "@/types";
import type { MemoryCard } from "@/types/ai";

export interface UserMemory {
  segment?: string;
  diagnoses: DiagnosisResult[];
  toolUsage: ToolUsageEntry[];
  catches: CatchEntry[];
  maintenance: MaintenanceSession[];
  goals: Goal[];
  completedStations: number[];
}

export interface IMemoryService {
  /** טוען זיכרון של משתמש */
  load(userId: string | null): Promise<UserMemory>;

  /** שומר אבחון חדש */
  saveDiagnosis(userId: string | null, d: DiagnosisResult): Promise<void>;

  /** שומר שימוש בכלי */
  saveToolUsage(userId: string | null, u: ToolUsageEntry): Promise<void>;

  /** שומר catch */
  saveCatch(userId: string | null, c: CatchEntry): Promise<void>;

  /** מחזיר Memory Card מתומצת ל-AI */
  buildCardFor(userId: string | null): Promise<MemoryCard>;

  /** מוחק הכול (לבקשת משתמש) */
  reset(userId: string | null): Promise<void>;
}
