/**
 * זיהוי מבנה הספר מתוך עמודים נקיים, והרכבת `BookSource` לייבוא.
 *
 * מזהה כותרות של חלקים (מבוא / פרקים / סיום / נספחים) לפי דפוסים עבריים,
 * ומחלק את התוכן לחלקים עם טווחי עמודים. שחזור הפסקאות אינו משכתב תוכן:
 * שורות חזותיות (שנשברו ע"י גלישת שורה ב-PDF) מחוברות חזרה, והפסקה נסגרת
 * בגבול משפט. אין המצאת פרקים — המבנה נגזר אך ורק מהכותרות שנמצאו בפועל.
 *
 * מודול טהור — ניתן לבדיקת יחידה עם קלט סינתטי.
 */
import type {
  BookSource,
  BookSourceChapter,
  SectionType,
} from "@/lib/compass/types";

/** עמוד נקי: מספר עמוד (1-based) ושורותיו בסדר קריאה. */
export interface CleanPage {
  pageNumber: number;
  lines: string[];
}

interface Heading {
  type: SectionType;
  /** מספר פרק שחולץ מהכותרת (אם היה מספר/מילת-מספר); אחרת null. */
  chapterNumber: number | null;
  name: string;
}

/** מילות-מספר עבריות סתמיות → ערך, לזיהוי "פרק ראשון".."פרק שלושה עשר". */
const HEBREW_ORDINALS: Record<string, number> = {
  ראשון: 1, שני: 2, שלישי: 3, רביעי: 4, חמישי: 5, שישי: 6, שביעי: 7,
  שמיני: 8, תשיעי: 9, עשירי: 10,
  "אחד עשר": 11, "אחד-עשר": 11, "אחדעשר": 11,
  "שנים עשר": 12, "שנים-עשר": 12, "שניםעשר": 12,
  "שלושה עשר": 13, "שלושה-עשר": 13, "שלושהעשר": 13,
};

// הערה: \b של JS מבוסס-ASCII ואינו עובד אחרי אות עברית; לכן משתמשים
// בגבול מפורש — סוף מחרוזת או תו הפרדה (רווח/פיסוק/מקף).
const BOUNDARY = "(?=$|[\\s:.,–—־-])";
const INTRO_RE = new RegExp(`^(מבוא|הקדמה|פתח\\s*דבר|פתיחה|דברי\\s*פתיחה)${BOUNDARY}`);
const CONCLUSION_RE = new RegExp(
  `^(אחרית\\s*דבר|סיכום|לסיכום|סיום|לסיום|דברי\\s*סיום|במקום\\s*סיכום|מסקנות)${BOUNDARY}`
);
const APPENDIX_RE = new RegExp(
  `^(נספח(?:ים)?|מילון\\s*מונחים|תודות|ביבליוגרפיה|מקורות|קריאה\\s*נוספת)${BOUNDARY}`
);
const CHAPTER_RE = /^פרק\s+(.+?)\s*[:–—-]?\s*(.*)$/;

/** האם השורה נראית ככותרת (קצרה, ללא סימן סיום משפט בסוף). */
function looksLikeHeading(line: string): boolean {
  return line.length > 0 && line.length <= 48 && !/[.!?…]$/.test(line);
}

/** מנסה לפרש שורה ככותרת חלק. מחזיר null אם אינה כותרת. */
export function parseHeading(rawLine: string): Heading | null {
  const line = rawLine.trim();
  if (!looksLikeHeading(line)) return null;

  const chapterMatch = line.match(CHAPTER_RE);
  if (chapterMatch) {
    const token = chapterMatch[1].trim();
    const rest = (chapterMatch[2] ?? "").trim();
    let num: number | null = null;
    const digit = token.match(/^\d{1,3}$/);
    if (digit) num = Number(digit[0]);
    else if (token in HEBREW_ORDINALS) num = HEBREW_ORDINALS[token];
    else {
      // צירוף של שתי מילים ("אחד עשר") — נסה גם את שתי המילים הראשונות.
      const two = line.replace(/^פרק\s+/, "").split(/\s+/).slice(0, 2).join(" ");
      if (two in HEBREW_ORDINALS) num = HEBREW_ORDINALS[two];
    }
    const name = rest || (num ? `פרק ${num}` : line);
    return { type: "chapter", chapterNumber: num, name };
  }
  if (INTRO_RE.test(line)) return { type: "intro", chapterNumber: null, name: line };
  if (CONCLUSION_RE.test(line)) return { type: "conclusion", chapterNumber: null, name: line };
  if (APPENDIX_RE.test(line)) return { type: "appendix", chapterNumber: null, name: line };
  return null;
}

/**
 * מחבר שורות חזותיות לפסקאות: שורות מצטרפות לפסקה הנוכחית (מחוברות ברווח),
 * והפסקה נסגרת כאשר הטקסט המצטבר מסתיים בסימן סיום משפט. אין שכתוב — רק
 * איחוד שורות שנשברו ע"י גלישת השורה של ה-PDF.
 */
export function linesToParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let buf = "";
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    buf = buf ? `${buf} ${l}` : l;
    if (/[.!?…]["'”’)\]]?$/.test(buf)) {
      paragraphs.push(buf);
      buf = "";
    }
  }
  if (buf) paragraphs.push(buf);
  return paragraphs;
}

interface Part {
  type: SectionType;
  chapterNumber: number | null;
  name: string;
  lines: string[];
  pageStart: number;
  pageEnd: number;
}

/**
 * גוזר `BookSource` מהעמודים הנקיים. תוכן שקדם לכותרת הראשונה מקובץ
 * כ"קדם-חלק" מסוג intro (שער/עמוד זכויות), כדי לא לאבד טקסט.
 */
export function detectStructure(
  pages: CleanPage[],
  meta: { version: string; title?: string }
): BookSource {
  const parts: Part[] = [];
  let current: Part | null = null;
  const chapterSeq = { intro: 0, chapter: 0, conclusion: 0, appendix: 0 };

  const openPart = (h: Heading, page: number) => {
    if (current) parts.push(current);
    chapterSeq[h.type] += 1;
    const number =
      h.type === "chapter" ? h.chapterNumber ?? chapterSeq.chapter : chapterSeq[h.type];
    current = {
      type: h.type,
      chapterNumber: number,
      name: h.name,
      lines: [],
      pageStart: page,
      pageEnd: page,
    };
  };

  for (const page of pages) {
    for (const line of page.lines) {
      const heading = parseHeading(line);
      if (heading) {
        openPart(heading, page.pageNumber);
        continue;
      }
      if (!current) {
        // תוכן לפני הכותרת הראשונה — עוטפים כ-intro כדי לא לאבד טקסט.
        chapterSeq.intro += 1;
        current = {
          type: "intro",
          chapterNumber: chapterSeq.intro,
          name: meta.title ?? "פתיחה",
          lines: [],
          pageStart: page.pageNumber,
          pageEnd: page.pageNumber,
        };
      }
      current.lines.push(line);
      current.pageEnd = page.pageNumber;
    }
  }
  if (current) parts.push(current);

  const chapters: BookSourceChapter[] = parts.map((p) => ({
    number: p.chapterNumber ?? 1,
    name: p.name,
    type: p.type,
    sections: [
      {
        name: null,
        paragraphs: linesToParagraphs(p.lines),
        pageStart: p.pageStart,
        pageEnd: p.pageEnd,
      },
    ],
  }));

  return { version: meta.version, title: meta.title, chapters };
}

/** ספירת חלקים לפי סוג — לדוח אימות המבנה. */
export function summarizeStructure(source: BookSource): Record<SectionType, number> {
  const counts: Record<SectionType, number> = {
    intro: 0,
    chapter: 0,
    conclusion: 0,
    appendix: 0,
  };
  for (const ch of source.chapters) counts[ch.type ?? "chapter"] += 1;
  return counts;
}
