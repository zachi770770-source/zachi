// מחלק את הספר ל-chunks סמנטיים.
// העיקרון: חלוקה לפי פסקאות (paragraph break), הצמדה של פסקאות קצרות,
// פיצול פסקאות ארוכות מדי. גודל יעד: 300-600 תווים.

import { createHash } from "node:crypto";
import type { BookChunk } from "../../src/types/rag";

const TARGET_MIN = 300;
const TARGET_MAX = 700;
const HARD_MAX = 1100;

// מיפוי שמות פרקים → metadata
interface ChapterMeta {
  key: string;
  title: string;
  stationId?: number;
  voiceTags: string[];
  toolTags: string[];
}

const CHAPTER_META: Record<string, ChapterMeta> = {
  intro: { key: "intro", title: "מבוא", voiceTags: [], toolTags: [] },
  "chapter-1": {
    key: "chapter-1-readiness",
    title: "פרק 1 — מי אוחז בהגה?",
    stationId: 1,
    voiceTags: ["approval", "avoidance", "pleasing", "rescuer", "clinging"],
    toolTags: ["whos-driving"],
  },
  "chapter-2": {
    key: "chapter-2-audition",
    title: "פרק 2 — תפסיקו לעשות אודישנים",
    stationId: 2,
    voiceTags: ["pleasing"],
    toolTags: ["soft-start"],
  },
  "chapter-3": {
    key: "chapter-3-noise",
    title: "פרק 3 — הרעש שבשקט",
    stationId: 3,
    voiceTags: ["approval", "clinging"],
    toolTags: ["fact-triangle", "timeout-with-return"],
  },
  "chapter-4": {
    key: "chapter-4-spark",
    title: "פרק 4 — שקר הניצוץ",
    stationId: 4,
    voiceTags: ["avoidance", "approval"],
    toolTags: ["spark-test", "chemistry-vs-movement"],
  },
  "chapter-5": {
    key: "chapter-5-gate",
    title: "פרק 5 — השער",
    stationId: 5,
    voiceTags: ["pleasing", "avoidance"],
    toolTags: ["gate-questions", "boundaries-tier", "excuses-ladder"],
  },
  "chapter-6": {
    key: "chapter-6-after-gate",
    title: "פרק 6 — כשהקשר נבחן",
    stationId: 6,
    voiceTags: ["avoidance"],
    toolTags: ["spark-test", "soft-start"],
  },
  "chapter-7": {
    key: "chapter-7-building",
    title: "פרק 7 — מה שבונה בינינו",
    stationId: 7,
    voiceTags: ["pleasing"],
    toolTags: ["twenty-min", "complaint-to-request", "soft-start"],
  },
  "chapter-8": {
    key: "chapter-8-repair",
    title: "פרק 8 — התיקון",
    stationId: 8,
    voiceTags: ["avoidance", "approval"],
    toolTags: ["one-percent", "timeout-with-return", "soft-start"],
  },
  closing: {
    key: "closing",
    title: "להמשיך לבנות",
    voiceTags: [],
    toolTags: [],
  },
  "appendix-a": {
    key: "appendix-a-emergency",
    title: "נספח א' — ערכת חירום למערכות יחסים",
    voiceTags: ["clinging", "approval"],
    toolTags: [
      "72-hours",
      "fact-triangle",
      "timeout-with-return",
      "soft-start",
      "complaint-to-request",
      "reality-anchor",
    ],
  },
  "appendix-b": {
    key: "appendix-b-three-days",
    title: "נספח ב' — עקרונות ליבה לשלושת הימים הראשונים",
    voiceTags: [],
    toolTags: [],
  },
  "appendix-c": {
    key: "appendix-c-reading-answers",
    title: "נספח ג' — איך לקרוא את התשובות שלכם",
    voiceTags: [],
    toolTags: [],
  },
  "appendix-d": {
    key: "appendix-d-exercises",
    title: "נספח ד' — תרגילים משלימים",
    voiceTags: [],
    toolTags: ["reversal"],
  },
  "appendix-e": {
    key: "appendix-e-glossary",
    title: "נספח ה' — מושגי מפתח",
    voiceTags: ["approval", "avoidance", "pleasing", "rescuer", "clinging"],
    toolTags: [],
  },
  "appendix-f": {
    key: "appendix-f-map",
    title: "נספח ו' — מפת מערכות היחסים",
    voiceTags: [],
    toolTags: [],
  },
  "appendix-g": {
    key: "appendix-g-healthy",
    title: "נספח ז' — איך זה נראה כשזה בריא",
    voiceTags: [],
    toolTags: [],
  },
  "five-tools": {
    key: "five-tools",
    title: "חמשת הכלים על עמוד אחד",
    voiceTags: ["approval", "avoidance", "pleasing", "rescuer", "clinging"],
    toolTags: [
      "whos-driving",
      "fact-triangle",
      "gate-questions",
      "boundaries-tier",
      "twenty-min",
    ],
  },
  letter: {
    key: "letter",
    title: "מכתב אליכם",
    voiceTags: [],
    toolTags: [],
  },
};

// זיהוי תחילת פרק לפי המספור בתחילת השורה
function detectChapter(line: string): string | null {
  const trimmed = line.trim();
  // מבוא
  if (trimmed === "מבוא") return "intro";
  // פרקים
  const chapterMatch = /^פרק\s+(\d+)\b/.exec(trimmed);
  if (chapterMatch) {
    const n = chapterMatch[1];
    return `chapter-${n}`;
  }
  // נספחים
  const apxMatch = /^נספח\s+([א-ז])'?\b/.exec(trimmed);
  if (apxMatch) {
    const map: Record<string, string> = {
      "א": "appendix-a",
      "ב": "appendix-b",
      "ג": "appendix-c",
      "ד": "appendix-d",
      "ה": "appendix-e",
      "ו": "appendix-f",
      "ז": "appendix-g",
    };
    return map[apxMatch[1]] ?? null;
  }
  if (trimmed === "להמשיך לבנות") return "closing";
  if (trimmed === "חמשת הכלים על עמוד אחד") return "five-tools";
  if (trimmed === "מכתב אליכם") return "letter";
  return null;
}

// זיהוי קולות וכלים שמוזכרים בטקסט (לתיוג metadata)
function detectVoiceTags(text: string): string[] {
  const tags = new Set<string>();
  if (/(אישור|נחוץ|רוצים אותי|לבדוק שוב)/.test(text)) tags.add("approval");
  if (/(לברוח|פגם|להימנע|חניק|אוויר|מרחב)/.test(text)) tags.add("avoidance");
  if (/(לרצות|בלעתי|לא לעשות עניין|נחמד מדי)/.test(text)) tags.add("pleasing");
  if (/(להציל|זקוק|לעזור לו|תיקון לאחר)/.test(text)) tags.add("rescuer");
  if (/(להיאחז|נואש|אין לי איך|חייב לחזור)/.test(text)) tags.add("clinging");
  return Array.from(tags);
}

function detectToolTags(text: string): string[] {
  const tags = new Set<string>();
  if (/משולש העובדה/.test(text)) tags.add("fact-triangle");
  if (/שלוש שאלות השער|שלוש השאלות/.test(text)) tags.add("gate-questions");
  if (/מדרג הגבולות|קו אדום.*צורך עומק/.test(text)) tags.add("boundaries-tier");
  if (/תחזוקת ה.20|עשרים דקות/.test(text)) tags.add("twenty-min");
  if (/72 שעות|שבעים ושתיים שעות/.test(text)) tags.add("72-hours");
  if (/סולם.*תירוצים/.test(text)) tags.add("excuses-ladder");
  if (/התחלה רכה/.test(text)) tags.add("soft-start");
  if (/אחוז אחד/.test(text)) tags.add("one-percent");
  if (/פסק זמן/.test(text)) tags.add("timeout-with-return");
  if (/עוגן מציאות/.test(text)) tags.add("reality-anchor");
  if (/ניצוץ בריא|ניצוץ חרדתי/.test(text)) tags.add("spark-test");
  if (/כימיה.*תנועה/.test(text)) tags.add("chemistry-vs-movement");
  if (/ההיפוך/.test(text)) tags.add("reversal");
  if (/מי אוחז בהגה/.test(text)) tags.add("whos-driving");
  return Array.from(tags);
}

function hashId(seed: string): string {
  return createHash("sha1").update(seed).digest("hex").slice(0, 16);
}

function splitOversizedParagraph(text: string): string[] {
  if (text.length <= HARD_MAX) return [text];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).trim().length > TARGET_MAX && buf.length > TARGET_MIN) {
      out.push(buf.trim());
      buf = s;
    } else {
      buf = (buf + " " + s).trim();
    }
  }
  if (buf) out.push(buf.trim());
  return out;
}

export function chunkBook(rawText: string): BookChunk[] {
  const lines = rawText.split("\n");
  const chunks: BookChunk[] = [];
  let currentChapterKey = "intro";
  let currentChapterMeta = CHAPTER_META.intro;
  let buffer: string[] = [];
  let chunkIndexPerChapter: Record<string, number> = {};

  const flush = () => {
    const joined = buffer.join("\n").trim();
    if (!joined) {
      buffer = [];
      return;
    }
    const pieces = splitOversizedParagraph(joined);
    for (const piece of pieces) {
      if (piece.length < 40) continue; // קצר מדי, דלג
      const idx = chunkIndexPerChapter[currentChapterKey] ?? 0;
      chunkIndexPerChapter[currentChapterKey] = idx + 1;
      const baseTags = currentChapterMeta;
      const voiceTags = Array.from(
        new Set([...baseTags.voiceTags, ...detectVoiceTags(piece)]),
      );
      const toolTags = Array.from(
        new Set([...baseTags.toolTags, ...detectToolTags(piece)]),
      );
      chunks.push({
        id: hashId(`${currentChapterMeta.key}:${idx}`),
        chapterKey: currentChapterMeta.key,
        chunkIndex: idx,
        content: piece,
        metadata: {
          chapterTitle: currentChapterMeta.title,
          voiceTags,
          toolTags,
          stationId: currentChapterMeta.stationId,
        },
      });
    }
    buffer = [];
  };

  for (const line of lines) {
    const detected = detectChapter(line);
    if (detected && CHAPTER_META[detected]) {
      flush();
      currentChapterKey = detected;
      currentChapterMeta = CHAPTER_META[detected];
      continue;
    }
    if (line.trim() === "") {
      // פסקה הסתיימה
      const current = buffer.join(" ").trim();
      if (current.length >= TARGET_MIN) {
        flush();
      }
      continue;
    }
    buffer.push(line.trim());
  }
  flush();
  return chunks;
}
