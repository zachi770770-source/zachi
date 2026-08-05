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
  | "boundary-ladder"
  | "emergency-kit";

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
 * כל ששת הכלים קיימים בכתב-היד ומאומתים (ראו book.ts). הקושי „מגיב/ה לרגע
 * ומתחרט/ת” (עמודה 2) מפנה תמיד ל„ערכת חירום כשהדפוס מקדים אותך” — כלי הרגע-החם
 * של הספר — בכל שלושת השלבים, כי זו בדיוק הבעיה שהוא פותר.
 *
 * הרציונל התוכני לכל תא:
 * • before-relationship
 *   0 → gate-questions   — פוסלים או מכתירים מהר; „שלוש שאלות השער” בודקות קשר
 *                          מתחיל בלי למהר להכריע.
 *   1 → fact-story-action— „סימן אמיתי או פרשנות?” — „עובדה, סיפור, פעולה” מפריד
 *                          את מה שקרה מהסיפור שנתנו לו.
 *   2 → emergency-kit    — תגובה רגעית ואצבע על הכפתור; „ערכת החירום” קונה שניות
 *                          לפני שהדפוס שולח את ההודעה.
 * • starting-again
 *   0 → gate-questions   — אחרי פרידה נועלים מסקנה מהר מתוך העבר; שער הבדיקה עוצר
 *                          את הפסילה האוטומטית.
 *   1 → boundary-ladder  — כשמשהו מפריע ולא ברור אם זה רצון, צורך או קו אדום;
 *                          „מדרג הגבולות” עוזר לקרוא את הסימן במקום לבלוע אותו.
 *   2 → emergency-kit    — אותה תגובתיות רגעית — ערכת החירום.
 * • inside-relationship
 *   0 → quiet-check      — בתוך קשר „נועלים מסקנה” על שקט/ריחוק; „בדיקת השקט”
 *                          מבדילה שקט בריא מחוסר עניין.
 *   1 → twenty-maintenance— „סימן אמיתי?” בתוך קשר — „תחזוקת ה-20” מחזירה מגע
 *                          וקריאה אמיתית של מי שבן/בת הזוג נעשה/תה היום.
 *   2 → emergency-kit    — תגובה רגעית בתוך קשר — ערכת החירום.
 *
 * כיסוי: gate-questions ✔, fact-story-action ✔, emergency-kit ✔, boundary-ladder ✔,
 * quiet-check ✔, twenty-maintenance ✔ — כל ששת הכלים נגישים.
 */
export const TOOL_BY_STAGE_DIFFICULTY: Record<StationId, ToolId[]> = {
  "before-relationship": ["gate-questions", "fact-story-action", "emergency-kit"],
  "starting-again": ["gate-questions", "boundary-ladder", "emergency-kit"],
  "inside-relationship": ["quiet-check", "twenty-maintenance", "emergency-kit"],
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
