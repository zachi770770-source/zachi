/**
 * מיפוי דטרמיניסטי של ה-Path Finder אל ששת הכלים האמיתיים מהספר.
 *
 * הכלי הנבחר נגזר מצירוף של *שתי* התשובות הראשונות:
 *   Q1 — התחנה (שלב בחיים): לפני קשר / מתחילים מחדש / בתוך קשר.
 *   Q2 — הקושי החוזר: נעילת מסקנה מהר / קושי לקרוא סימן / תגובה רגעית.
 * Q3 (מה הכי יעזור עכשיו) אינו משנה את הכלי — הוא רק קובע את סדר הפעולות
 * המשניות בתוצאה (טעימה / מצפן / תחנה). כך כל צירוף מלא של Q1×Q2×Q3 מחזיר
 * בדיוק כלי אחד, וכל ששת הכלים נגישים דרך צירופי Q1×Q2.
 *
 * המיפוי אינו „מתמטיקה שרירותית”: כל תא נגזר מהתאמה תוכנית בין הקושי בשלב
 * החיים לבין מה שהכלי עושה בפועל (ראו התיעוד לכל שורה למטה). המיפוי כולו
 * רץ בצד-הלקוח בלבד — התשובות אינן נשלחות לשרת או לאנליטיקה.
 */

import type { Station } from "@/content/stations";

/** מזהה תחנה (שלב-חיים) — נגזר מטיפוס התחנה הקיים. */
export type StationId = Station["id"];

/** מזהי הכלים כפי שהם ב-src/content/book.ts (עוגן `#tool-<id>` ב-/book). */
export type ToolId =
  | "fact-story-action"
  | "gate-questions"
  | "quiet-check"
  | "twenty-maintenance"
  | "rule-72h"
  | "process-30-days";

/** שלושת שלבי-החיים (Q1), בסדר התצוגה בשאלון. */
export const STAGES: StationId[] = [
  "before-relationship",
  "starting-again",
  "inside-relationship",
];

/** מספר אפשרויות הקושי (Q2) ומספר אפשרויות ההעדפה (Q3). */
export const DIFFICULTY_COUNT = 3;
export const PREFERENCE_COUNT = 3;

/**
 * טבלת ההחלטה: לכל תחנה (Q1) שלושה כלים לפי אינדקס הקושי שנבחר (Q2 = 0/1/2).
 *
 * העמודות (Q2): 0 = „נועל/ת מסקנה מהר”, 1 = „קשה לדעת אם זה סימן אמיתי”,
 * 2 = „מגיב/ה לרגע ומתחרט/ת”.
 *
 * הרציונל התוכני לכל תא:
 * • before-relationship
 *   0 → gate-questions   — פוסלים או מכתירים מהר; „שלוש שאלות השער” בודקות קשר
 *                          מתחיל בלי למהר להכריע.
 *   1 → fact-story-action— „סימן אמיתי או פרשנות?” — „עובדה, סיפור, פעולה” מפריד
 *                          את מה שקרה מהסיפור שנתנו לו.
 *   2 → rule-72h         — תגובה רגעית מול מסקנה; „כלל 72 השעות” נותן זמן להבחין.
 * • starting-again
 *   0 → gate-questions   — אחרי פרידה נועלים מסקנה מהר מתוך העבר; שער הבדיקה עוצר
 *                          את הפסילה האוטומטית.
 *   1 → process-30-days  — קשה לקרוא סימנים כשחוזרים; „תהליך 30 הימים” נותן מסגרת
 *                          זמן שמאפשרת לקשר חדש להתברר.
 *   2 → rule-72h         — אותה תגובתיות רגעית — כלל 72 השעות.
 * • inside-relationship
 *   0 → quiet-check      — בתוך קשר „נועלים מסקנה” על שקט/ריחוק; „בדיקת השקט”
 *                          מבדילה שקט בריא מחוסר עניין.
 *   1 → quiet-check      — „סימן אמיתי?” בתוך קשר הוא בדיוק שאלת השקט.
 *   2 → twenty-maintenance— תגובה רגעית בתוך קשר; „תחזוקת ה-20” מחליפה תגובתיות
 *                          בתשומת-לב יומיומית קטנה וקבועה.
 *
 * כיסוי: gate-questions ✔, fact-story-action ✔, rule-72h ✔, process-30-days ✔,
 * quiet-check ✔, twenty-maintenance ✔ — כל ששת הכלים נגישים.
 */
export const TOOL_BY_STAGE_DIFFICULTY: Record<StationId, ToolId[]> = {
  "before-relationship": ["gate-questions", "fact-story-action", "rule-72h"],
  "starting-again": ["gate-questions", "process-30-days", "rule-72h"],
  "inside-relationship": ["quiet-check", "quiet-check", "twenty-maintenance"],
};

/**
 * מחזיר את מזהה הכלי עבור צירוף (תחנה, אינדקס-קושי). דטרמיניסטי לחלוטין;
 * שגיאה על קלט מחוץ לתחום כדי שהבדיקה תתפוס „תא חסר”.
 */
export function resolveToolId(station: StationId, difficultyIndex: number): ToolId {
  const row = TOOL_BY_STAGE_DIFFICULTY[station];
  const id = row?.[difficultyIndex];
  if (!id) {
    throw new Error(
      `resolveToolId: no tool for station="${station}" difficulty=${difficultyIndex}`,
    );
  }
  return id;
}
