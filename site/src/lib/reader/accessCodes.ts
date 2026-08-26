/**
 * קוד-הפעלה לקורא (Reader Access Code) — proof-of-possession של הספר, לא אימות
 * רכישה מאמזון. KDP אינו חושף למחבר מזהי-הזמנה או זהות-קונה, ולכן אין דרך אמיתית
 * להשוות „מספר הזמנה” שהקורא מזין. במקום זה, הקוד מודפס בתוך הספר: מי שמחזיק בספר
 * מחזיק בקוד.
 *
 * הקודים התקפים נשמרים בסוד-שרת בלבד (`READER_ACCESS_CODES`, רשימה מופרדת-פסיקים)
 * — לעולם לא בקוד המקור ולא בצד-לקוח. השוואה מנורמלת (ללא רישיות/רווחים/מקפים)
 * כדי לסלוח על אופן ההקלדה, יחד עם rate-limit בנתיב ההפעלה מול ניסוי-קודים.
 */

/** נרמול קוד להשוואה: אותיות גדולות, בלי רווחים/מקפים. */
export function normalizeAccessCode(code: string): string {
  return code.trim().toUpperCase().replace(/[\s-]+/g, "");
}

/** אוסף הקודים התקפים מהסביבה (מנורמלים). ריק כשאין הגדרה. */
export function getConfiguredAccessCodes(): Set<string> {
  const raw = process.env.READER_ACCESS_CODES ?? "";
  return new Set(
    raw
      .split(",")
      .map((c) => normalizeAccessCode(c))
      .filter((c) => c.length > 0),
  );
}

/** האם ההפעלה בכלל זמינה בסביבה הזו (הוגדר לפחות קוד אחד). */
export function isReaderActivationConfigured(): boolean {
  return getConfiguredAccessCodes().size > 0;
}

/** האם קוד שהוזן תקף. false כשאין קודים מוגדרים כלל. */
export function isValidAccessCode(input: string): boolean {
  const codes = getConfiguredAccessCodes();
  if (codes.size === 0) return false;
  return codes.has(normalizeAccessCode(input));
}
