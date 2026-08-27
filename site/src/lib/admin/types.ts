/**
 * מודל-מדד ל-Dashboard. כל KPI נושא *סטטוס מפורש*: `ok` (נתון אמיתי), `empty`
 * (מקור מחובר אך אין נתונים בטווח), או `unsupported` (המקור אינו מחובר — למשל
 * GA4 Data API לא מוגדר). כך לעולם לא מוצג מספר מומצא: מקום שאין בו נתון אמיתי
 * מראה מצב ברור במקום ערך.
 */

export type MetricUnit = "users" | "sessions" | "events" | "count" | "percent";

/** מאיפה מגיע המדד — לשקיפות מלאה מול הדרישה „נתונים אמיתיים בלבד”. */
export type MetricSource = "first_party" | "ga4";

export type MetricValue =
  | { status: "ok"; value: number; previous: number | null }
  | { status: "empty" }
  | { status: "unsupported"; reason: string };

export type Kpi = {
  id: string;
  label: string;
  /** הגדרה מדויקת של המדד — users/sessions/events אינם מעורבבים. */
  definition: string;
  unit: MetricUnit;
  source: MetricSource;
  value: MetricValue;
};

export function ok(value: number, previous: number | null = null): MetricValue {
  return { status: "ok", value, previous };
}
export function unsupported(reason: string): MetricValue {
  return { status: "unsupported", reason };
}
export const empty: MetricValue = { status: "empty" };

/** חישוב שינוי-אחוזי מול התקופה הקודמת (null כשאין בסיס להשוואה). */
export function deltaPct(value: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return ((value - previous) / previous) * 100;
}

/** מזהה-מקור-נתונים קריא לתצוגה. */
export const SOURCE_LABEL: Record<MetricSource, string> = {
  first_party: "נתוני האתר (Postgres)",
  ga4: "Google Analytics 4",
};
