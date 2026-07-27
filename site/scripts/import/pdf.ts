/**
 * חילוץ טקסט מ-PDF עם pdf.js (בנייית legacy ל-Node), בסדר קריאה עברי.
 *
 * מחזיר לכל עמוד את שורותיו המסודרות (ימין→שמאל, מלמעלה למטה) ואת מספר
 * העמודים. אם אין שכבת-טקסט (PDF סרוק) — מדווח על כך כדי שה-orchestrator
 * יעצור *לפני* OCR רחב (כפי שנדרש), במקום לחלץ ג'יבריש.
 *
 * מודול I/O לסקריפט הייבוא בלבד — אינו מיובא ע"י קוד האפליקציה, ולכן
 * pdf.js לא נכנס ל-bundle של האתר.
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { orderPageLines, type PositionedText } from "@/lib/compass/extract/reading-order";

/** צורת פריט-טקסט של pdf.js (מוגדר מקומית — לא כל בנייה מייצאת את הטיפוס). */
interface PdfTextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
}

export interface ExtractedPage {
  pageNumber: number;
  lines: string[];
  /** מספר התווים הגולמי בעמוד — אינדיקציה לקיום שכבת-טקסט. */
  rawCharCount: number;
}

export interface ExtractedPdf {
  pageCount: number;
  pages: ExtractedPage[];
  /** סך התווים בכל המסמך. ~0 ⇒ ככל הנראה PDF סרוק ללא שכבת-טקסט. */
  totalChars: number;
  /** true אם נמצאה שכבת-טקסט משמעותית (מעל הסף). */
  hasTextLayer: boolean;
}

function isTextItem(item: unknown): item is PdfTextItem {
  return (
    typeof (item as PdfTextItem)?.str === "string" &&
    Array.isArray((item as PdfTextItem)?.transform)
  );
}

/**
 * מחלץ את כל עמודי ה-PDF. `minCharsForTextLayer` — סף תווים כולל שמתחתיו
 * נחשב שאין שכבת-טקסט (ברירת מחדל 200, שמרני עבור ספר שלם).
 */
export async function extractPdf(
  data: Uint8Array,
  opts: { minCharsForTextLayer?: number } = {}
): Promise<ExtractedPdf> {
  const doc = await getDocument({
    data,
    // אין צורך בגופני מערכת/CMaps חיצוניים לחילוץ טקסט בלבד; משתיק אזהרות.
    useSystemFonts: true,
    isEvalSupported: false,
  }).promise;

  const pageCount = doc.numPages;
  const pages: ExtractedPage[] = [];
  let totalChars = 0;

  for (let n = 1; n <= pageCount; n += 1) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const items: PositionedText[] = [];
    let rawCharCount = 0;
    for (const raw of content.items) {
      if (!isTextItem(raw)) continue;
      const t = raw.transform;
      rawCharCount += raw.str.length;
      items.push({
        str: raw.str,
        x: t[4],
        y: t[5],
        width: raw.width,
        height: raw.height || Math.hypot(t[1] ?? 0, t[3] ?? 0) || 10,
      });
    }
    totalChars += rawCharCount;
    pages.push({ pageNumber: n, lines: orderPageLines(items), rawCharCount });
    // משחררים משאבי עמוד (חשוב לספרים גדולים).
    page.cleanup();
  }

  await doc.cleanup();
  await doc.destroy();

  const minChars = opts.minCharsForTextLayer ?? 200;
  return {
    pageCount,
    pages,
    totalChars,
    hasTextLayer: totalChars >= minChars,
  };
}
