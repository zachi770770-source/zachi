/**
 * סידור פריטי-טקסט של pdf.js לסדר קריאה עברי (ימין→שמאל, שורות מלמעלה למטה).
 *
 * pdf.js מחזיר פריטי-טקסט עם מטריצת מיקום (transform). הסדר בזרם התוכן של
 * ה-PDF אינו מובטח להיות סדר הקריאה החזותי — במסמכים עבריים הוא לרוב הפוך.
 * כאן אנו מקבצים פריטים לשורות לפי קואורדינטת ה-Y, וממיינים כל שורה לפי X
 * יורד (הפריט הימני ביותר נקרא ראשון) — כלומר סדר קריאה עברי דטרמיניסטי.
 *
 * מודול טהור (ללא תלות ב-pdf.js) — ניתן לבדיקת יחידה עם קלט סינתטי.
 */

/** פריט טקסט ממוקם — נגזר מ-transform[4]=x, transform[5]=y של pdf.js. */
export interface PositionedText {
  str: string;
  /** transform[4] — קצה שמאלי של הפריט (יחידות משתמש של ה-PDF). */
  x: number;
  /** transform[5] — בסיס הטקסט; ערך גבוה = גבוה יותר בעמוד. */
  y: number;
  /** רוחב הפריט (משמש לחישוב מרווחי מילים; אופציונלי). */
  width?: number;
  /** גובה הגופן/שורה — בסיס לסובלנות קיבוץ השורות. */
  height?: number;
}

/**
 * חציון גובה הפריטים — בסיס יציב לסובלנות קיבוץ שורות (עמיד לחריגים,
 * להבדיל מממוצע שכותרת ענקית אחת יכולה להטות).
 */
function medianHeight(items: PositionedText[]): number {
  const hs = items
    .map((i) => i.height ?? 0)
    .filter((h) => h > 0)
    .sort((a, b) => a - b);
  if (hs.length === 0) return 10; // ברירת מחדל שמרנית
  const mid = Math.floor(hs.length / 2);
  return hs.length % 2 ? hs[mid] : (hs[mid - 1] + hs[mid]) / 2;
}

/**
 * מנרמל רווחים בתוך שורה בודדת: מאחד רצפים לרווח יחיד וגוזם קצוות. אינו
 * מוחק תווים ואינו משכתב — רק רווחים.
 */
function joinLine(parts: string[]): string {
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * ממיר פריטי-טקסט ממוקמים לרשימת שורות בסדר קריאה עברי.
 *
 * @param items פריטי הטקסט של העמוד (בכל סדר).
 * @param opts.lineToleranceRatio חלק מגובה החציון שבתוכו פריטים נחשבים
 *   לאותה שורה (ברירת מחדל 0.6).
 */
export function orderPageLines(
  items: PositionedText[],
  opts: { lineToleranceRatio?: number } = {}
): string[] {
  const meaningful = items.filter((i) => i.str && i.str.trim().length > 0);
  if (meaningful.length === 0) return [];

  const tol = medianHeight(meaningful) * (opts.lineToleranceRatio ?? 0.6);

  // מיון ראשוני לפי Y יורד (מלמעלה למטה) לצורך קיבוץ יציב לשורות.
  const byY = [...meaningful].sort((a, b) => b.y - a.y);

  const lines: PositionedText[][] = [];
  let current: PositionedText[] = [];
  let anchorY = Number.NaN;
  for (const item of byY) {
    if (current.length === 0 || Math.abs(item.y - anchorY) <= tol) {
      current.push(item);
      // עוגן השורה = ה-Y של הפריט הראשון בה (יציב תוך כדי הקיבוץ).
      if (Number.isNaN(anchorY)) anchorY = item.y;
    } else {
      lines.push(current);
      current = [item];
      anchorY = item.y;
    }
  }
  if (current.length > 0) lines.push(current);

  // בתוך כל שורה: מיון לפי X יורד = ימין→שמאל (סדר קריאה עברי).
  return lines
    .map((line) =>
      joinLine([...line].sort((a, b) => b.x - a.x).map((i) => i.str))
    )
    .filter((s) => s.length > 0);
}
