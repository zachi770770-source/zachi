/**
 * ניקוי טקסט מחולץ מ-PDF — ברמת שורות, לפני זיהוי מבנה וחלוקה לקטעים.
 *
 * מותר לנקות אך ורק רעש טכני של החילוץ:
 *   • מספרי עמוד (שורה שכולה ספרה/מספר).
 *   • כותרות רצות עליונות/תחתונות (שורה קצרה שחוזרת על פני עמודים רבים).
 *   • שורות כפולות עוקבות (ארטיפקט חילוץ).
 *   • רווחים משובשים — אות-רווח-אות ("ש ל ו ם" → "שלום"), ורצפי רווחים.
 *
 * אסור: שכתוב משפטים, איחוד/פיצול תוכן, תיקון ניסוח. רק רעש טכני.
 * מודול טהור — ניתן לבדיקת יחידה.
 */

/** נראה כמספר עמוד: שורה שכולה ספרות (אולי בעטיפת סימני פיסוק/מקפים). */
function isPageNumber(line: string): boolean {
  return /^[\s.\-–—|·]*\d{1,4}[\s.\-–—|·]*$/.test(line.trim());
}

/**
 * מתקן ריווח-אותיות משובש: רצף של אותיות עבריות בודדות מופרדות ברווח
 * (למשל justification שנשבר ל-"ש ל ו ם") מאוחד למילה. שמרני: מטפל רק
 * ברצפים של ≥3 אותיות-בודדות-עבריות רצופות, כדי לא לאחד מילים אמיתיות
 * בנות אות אחת.
 */
export function fixLetterSpacing(line: string): string {
  // רצף של אות עברית בודדת + רווח, החוזר ≥3 פעמים, ואז אות אחרונה שאינה
  // ממשיכה למילה אמיתית (lookahead שלילי מונע בליעת ההברה הבאה).
  return line.replace(
    /[֐-׿] (?:[֐-׿] ){1,}[֐-׿](?![֐-׿])/g,
    (m) => m.replace(/ /g, "")
  );
}

/** מנרמל רווחים בשורה בודדת: מאחד רצפים לרווח יחיד וגוזם. */
function normalizeSpaces(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

/**
 * מזהה כותרות-רצות מועמדות: שורות קצרות (≤ maxLen תווים) שמופיעות על פני
 * לפחות minFraction מהעמודים. מוחזרות מנורמלות להשוואה.
 */
function detectRunningHeaders(
  pages: string[][],
  minFraction: number,
  maxLen: number
): Set<string> {
  const pageCount = pages.length;
  if (pageCount < 4) return new Set(); // מעט מדי עמודים לזהות דפוס חזרה
  const seenOnPages = new Map<string, number>();
  for (const lines of pages) {
    // חוזרים על שורות ייחודיות בעמוד — חזרה בתוך אותו עמוד נספרת פעם אחת.
    const uniq = new Set(
      lines
        .map((l) => normalizeSpaces(l))
        .filter((l) => l.length > 0 && l.length <= maxLen && !isPageNumber(l))
    );
    for (const l of uniq) seenOnPages.set(l, (seenOnPages.get(l) ?? 0) + 1);
  }
  const threshold = Math.max(3, Math.ceil(pageCount * minFraction));
  const headers = new Set<string>();
  for (const [line, count] of seenOnPages) {
    if (count >= threshold) headers.add(line);
  }
  return headers;
}

export interface CleanOptions {
  /** חלק מהעמודים שבו שורה קצרה נחשבת כותרת-רצה (ברירת מחדל 0.3). */
  headerMinFraction?: number;
  /** אורך מרבי לשורה שיכולה להיחשב כותרת-רצה (ברירת מחדל 60). */
  headerMaxLen?: number;
}

/** סיכום הניקויים שבוצעו — לדוח בלבד. */
export interface CleaningStats {
  /** שורות שהוסרו כמספרי עמוד. */
  pageNumbersRemoved: number;
  /** כותרות רצות שזוהו (מנורמלות) והוסרו. */
  runningHeaders: string[];
  /** מספר מופעים של כותרות רצות שהוסרו (על פני כל העמודים). */
  runningHeadersRemoved: number;
  /** שורות כפולות עוקבות שהוסרו. */
  duplicatesRemoved: number;
  /** שורות שבהן תוקן ריווח-אותיות משובש. */
  letterSpacingFixed: number;
  /** סך שורות לפני/אחרי (אינדיקציה כללית). */
  linesBefore: number;
  linesAfter: number;
}

/**
 * מנקה עמודים ומחזיר גם את התוכן הנקי וגם סיכום מפורט של מה שהוסר/תוקן.
 * לא מוחק תוכן ממשי — רק מספרי עמוד, כותרות רצות, כפילויות עוקבות ורווחים
 * משובשים.
 */
export function cleanPagesDetailed(
  pages: string[][],
  opts: CleanOptions = {}
): { pages: string[][]; stats: CleaningStats } {
  const headers = detectRunningHeaders(
    pages,
    opts.headerMinFraction ?? 0.3,
    opts.headerMaxLen ?? 60
  );
  const stats: CleaningStats = {
    pageNumbersRemoved: 0,
    runningHeaders: [...headers].sort(),
    runningHeadersRemoved: 0,
    duplicatesRemoved: 0,
    letterSpacingFixed: 0,
    linesBefore: 0,
    linesAfter: 0,
  };

  const cleaned = pages.map((lines) => {
    const out: string[] = [];
    let prev: string | null = null;
    for (const raw of lines) {
      stats.linesBefore += 1;
      const fixed = fixLetterSpacing(raw);
      if (fixed !== raw) stats.letterSpacingFixed += 1;
      const line = normalizeSpaces(fixed);
      if (!line) continue;
      if (isPageNumber(line)) {
        stats.pageNumbersRemoved += 1;
        continue;
      }
      if (headers.has(line)) {
        stats.runningHeadersRemoved += 1;
        continue;
      }
      // שורה כפולה עוקבת (ארטיפקט) — מדלגים על החזרה המיידית.
      if (prev !== null && line === prev) {
        stats.duplicatesRemoved += 1;
        continue;
      }
      out.push(line);
      prev = line;
    }
    return out;
  });

  stats.linesAfter = cleaned.reduce((n, p) => n + p.length, 0);
  return { pages: cleaned, stats };
}

/**
 * מנקה עמודים (כל עמוד = מערך שורות) ומחזיר עמודים נקיים. לא מוחק תוכן
 * ממשי — רק מספרי עמוד, כותרות רצות, כפילויות עוקבות ורווחים משובשים.
 */
export function cleanPages(pages: string[][], opts: CleanOptions = {}): string[][] {
  return cleanPagesDetailed(pages, opts).pages;
}
