/**
 * זמן-קריאה שנגזר מהטקסט עצמו.
 *
 * הכותרת „טעימה מהספר · 2 דקות קריאה” הייתה מחרוזת קבועה. בפועל עמוד-הטעימה
 * מכיל *שני* גושי-קריאה — הטעימה המודרכת ותשע פסקאות המבוא הקנוניות — כלומר
 * כמה מונים יותר ממה שהובטח (נמדד: 8.6 מסכים במובייל). הבטחה שאינה מתקיימת
 * היא הדבר שהמבקר זוכר, גם כשהתוכן עצמו טוב.
 *
 * לכן המספר מחושב מהמילים שבאמת מוצגות. אם יתווסף או ייגרע טקסט, המספר יזוז
 * איתו — ואי-אפשר יהיה שהכותרת והתוכן ייפרדו שוב.
 *
 * 200 מילים לדקה: קצב קריאה שמרני ומקובל לעברית רהוטה. מעוגל כלפי מעלה,
 * ולעולם לא פחות מדקה.
 */
const WORDS_PER_MINUTE = 200;

/** סופר מילים על פני מקטעי-טקסט (עברית, לטינית וספרות). */
export function countWords(...texts: (string | readonly string[])[]): number {
  const flat = texts.flatMap((t) => (Array.isArray(t) ? [...t] : [t as string]));
  return flat.reduce((total, text) => {
    const matches = String(text).match(/[֐-׿A-Za-z0-9]+/g);
    return total + (matches ? matches.length : 0);
  }, 0);
}

/** מספר הדקות המעוגל כלפי מעלה (מינימום 1). */
export function readingMinutes(...texts: (string | readonly string[])[]): number {
  return Math.max(1, Math.ceil(countWords(...texts) / WORDS_PER_MINUTE));
}

/** „N דקות קריאה” / „דקה אחת של קריאה”. */
export function readingLabel(minutes: number): string {
  return minutes === 1 ? "דקה אחת של קריאה" : `${minutes} דקות קריאה`;
}
