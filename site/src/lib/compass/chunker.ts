import { createHash } from "node:crypto";

import type { BookChunk, BookSource, BookSourceChapter } from "@/lib/compass/types";

/** יעד גודל קטע (תווים) — מספיק להקשר, קצר מכדי להיות פרק שלם. */
const TARGET_CHARS = 900;
/** גבול קשיח — קטע לא יעבור אותו; פסקה ארוכה מזה תפוצל לפי משפטים שלמים. */
const MAX_CHARS = 1400;

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** מנרמל רווחים בתוך פסקה, בלי לגעת בתוכן. */
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * מפצל טקסט למשפטים שלמים — אחרי סימני סיום משפט ורווח. לעולם לא חותך
 * משפט באמצע (התו הסוגר נשאר עם המשפט שלפניו).
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** אורז משפטים שלמים לקטעים עד MAX_CHARS, בלי לחתוך משפט. */
function packSentences(paragraph: string): string[] {
  const sentences = splitSentences(paragraph);
  const out: string[] = [];
  let buf = "";
  for (const sentence of sentences) {
    if (buf && buf.length + 1 + sentence.length > MAX_CHARS) {
      out.push(buf);
      buf = sentence;
    } else {
      buf = buf ? `${buf} ${sentence}` : sentence;
    }
  }
  if (buf) out.push(buf);
  return out;
}

/**
 * חלוקה סמנטית של הספר לקטעים: לפי פרק → סעיף → פסקאות. פסקאות סמוכות
 * מאוחדות לקטע עד יעד הגודל, תמיד בגבול פסקה. פסקה ארוכה מהגבול הקשיח
 * מפוצלת לפי משפטים שלמים בלבד. אין חיתוך משפטים באמצע.
 *
 * `sectionOrder` רציף מ-1 לאורך כל הגרסה, ומשמש לשמירת סדר — אך אינו נחשף
 * לחיפוש כאמצעי מעבר סדרתי (ראו search.ts).
 */
export function chunkBook(source: BookSource): BookChunk[] {
  const chunks: BookChunk[] = [];
  let order = 0;
  // מונה מקומי לכל חלק (type+number) — בסיס ל-stableChunkId היציב.
  const localCount = new Map<string, number>();

  const push = (
    chapter: BookSourceChapter,
    sectionName: string | null,
    pageStart: number | null,
    pageEnd: number | null,
    content: string
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    order += 1;
    const sectionType = chapter.type ?? "chapter";
    const partKey = `${sectionType}:${chapter.number}`;
    const localOrder = (localCount.get(partKey) ?? 0) + 1;
    localCount.set(partKey, localOrder);
    chunks.push({
      bookVersion: source.version,
      sectionType,
      chapterNumber: chapter.number,
      chapterName: chapter.name,
      sectionName,
      sectionOrder: order,
      pageStart,
      pageEnd,
      content: trimmed,
      checksum: sha256(trimmed),
      stableChunkId: sha256(
        `${source.version}|${sectionType}|${chapter.number}|${localOrder}`
      ),
    });
  };

  for (const chapter of source.chapters) {
    for (const section of chapter.sections) {
      const sectionName = section.name ? normalize(section.name) : null;
      const paragraphs = section.paragraphs.map(normalize).filter(Boolean);
      const ps = section.pageStart ?? null;
      const pe = section.pageEnd ?? null;

      let buf = "";
      const flush = () => {
        if (buf) {
          push(chapter, sectionName, ps, pe, buf);
          buf = "";
        }
      };

      for (const para of paragraphs) {
        if (para.length > MAX_CHARS) {
          flush();
          for (const piece of packSentences(para)) {
            push(chapter, sectionName, ps, pe, piece);
          }
          continue;
        }
        if (buf && buf.length + 2 + para.length > TARGET_CHARS) {
          flush();
        }
        buf = buf ? `${buf}\n\n${para}` : para;
      }
      flush();
    }
  }

  return chunks;
}
