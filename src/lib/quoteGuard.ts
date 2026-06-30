/**
 * Quote Guard — מבטיח שתשובות AI לא מצטטות יותר מ-25 מילים ברצף מהספר.
 * שומר על זכויות יוצרים גם אם המודל ניסה לצטט פסקה שלמה מתוך excerpts.
 */

const MAX_VERBATIM_WORDS = 25;

/**
 * מקבל טקסט תשובה ורשימת excerpts (הקטעים שנשלפו).
 * אם הוא מזהה רצף של MAX_VERBATIM_WORDS מילים שמופיעות כצמד טקסט בכל excerpt —
 * חותך אותו ומחליף בפרפרזה מסומנת.
 */
export function applyQuoteGuard(
  output: string,
  excerptTexts: string[],
): { text: string; redacted: number } {
  if (excerptTexts.length === 0) return { text: output, redacted: 0 };

  let redactedCount = 0;
  let result = output;

  for (const excerpt of excerptTexts) {
    const words = excerpt.split(/\s+/).filter(Boolean);
    if (words.length < MAX_VERBATIM_WORDS) continue;

    // sliding window של MAX_VERBATIM_WORDS+1 מילים מתוך ה-excerpt
    for (let i = 0; i <= words.length - (MAX_VERBATIM_WORDS + 1); i++) {
      const window = words.slice(i, i + MAX_VERBATIM_WORDS + 1).join(" ");
      // בדיקה מילולית פשוטה — חיפוש substring
      if (result.includes(window)) {
        // חתוך את הציטוט והחלף בקיצור
        const shortQuote = words.slice(i, i + 15).join(" ") + "…";
        result = result.replace(window, `"${shortQuote}" (בלשון הספר)`);
        redactedCount++;
      }
    }
  }

  return { text: result, redacted: redactedCount };
}
