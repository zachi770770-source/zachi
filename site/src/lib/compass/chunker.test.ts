import { describe, it, expect } from "vitest";

import { chunkBook } from "@/lib/compass/chunker";
import { sampleBook } from "@/lib/compass/__fixtures__/sampleBook";
import type { BookSource } from "@/lib/compass/types";

describe("chunkBook", () => {
  it("produces ordered chunks carrying chapter/section metadata", () => {
    const chunks = chunkBook(sampleBook);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    chunks.forEach((c, i) => {
      expect(c.sectionOrder).toBe(i + 1);
      expect(c.bookVersion).toBe("fixture-v1");
      expect(c.chapterName).toBeTruthy();
      expect(c.content.trim()).toBe(c.content);
      expect(c.checksum).toMatch(/^[a-f0-9]{64}$/);
      expect(c.stableChunkId).toMatch(/^[a-f0-9]{64}$/);
      // ברירת המחדל של הפיקסצ'ר (ללא type מפורש) היא "chapter".
      expect(c.sectionType).toBe("chapter");
    });
  });

  it("carries section type and page range from the source", () => {
    const src: BookSource = {
      version: "v",
      chapters: [
        {
          number: 1,
          name: "פתח דבר",
          type: "intro",
          sections: [{ paragraphs: ["פתיחה קצרה."], pageStart: 7, pageEnd: 9 }],
        },
        {
          number: 1,
          name: "פרק ראשון",
          sections: [{ paragraphs: ["גוף הפרק."], pageStart: 11, pageEnd: 20 }],
        },
      ],
    };
    const chunks = chunkBook(src);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].sectionType).toBe("intro");
    expect(chunks[0].pageStart).toBe(7);
    expect(chunks[0].pageEnd).toBe(9);
    expect(chunks[1].sectionType).toBe("chapter");
    expect(chunks[1].pageStart).toBe(11);
  });

  it("gives each part its own stableChunkId namespace (no collision across types)", () => {
    // מבוא ופרק החולקים אותו number לא מייצרים מזהה יציב זהה.
    const src: BookSource = {
      version: "v",
      chapters: [
        { number: 1, name: "מבוא", type: "intro", sections: [{ paragraphs: ["א."] }] },
        { number: 1, name: "פרק", type: "chapter", sections: [{ paragraphs: ["ב."] }] },
      ],
    };
    const [intro, chapter] = chunkBook(src);
    expect(intro.stableChunkId).not.toBe(chapter.stableChunkId);
  });

  it("stableChunkId is deterministic and structure-stable across re-imports", () => {
    const a = chunkBook(sampleBook);
    const b = chunkBook(sampleBook);
    expect(a.map((c) => c.stableChunkId)).toEqual(b.map((c) => c.stableChunkId));
    // מזהים ייחודיים בתוך גרסה (בסיס לאילוץ ה-unique ב-DB).
    expect(new Set(a.map((c) => c.stableChunkId)).size).toBe(a.length);
  });

  it("keeps every chunk within the hard size limit", () => {
    for (const c of chunkBook(sampleBook)) {
      expect(c.content.length).toBeLessThanOrEqual(1400);
    }
  });

  it("never cuts a sentence in the middle (each chunk ends at a sentence boundary)", () => {
    // פסקה ארוכה מאוד (~2400 תווים) שתיאלץ פיצול לפי משפטים.
    const long = Array.from(
      { length: 100 },
      (_, i) => `זהו משפט בדיקה ארוך מספר ${i} שנועד להאריך את הפסקה.`
    ).join(" ");
    const src: BookSource = {
      version: "v",
      chapters: [{ number: 1, name: "פרק", sections: [{ name: "ס", paragraphs: [long] }] }],
    };
    const chunks = chunkBook(src);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      // כל קטע מסתיים בסימן סיום משפט — כלומר לא נחתך באמצע.
      expect(c.content.trim()).toMatch(/[.!?…]$/);
    }
  });

  it("is deterministic — same input yields identical checksums", () => {
    const a = chunkBook(sampleBook);
    const b = chunkBook(sampleBook);
    expect(a.map((c) => c.checksum)).toEqual(b.map((c) => c.checksum));
  });

  it("skips empty paragraphs without creating empty chunks", () => {
    const src: BookSource = {
      version: "v",
      chapters: [
        { number: 1, name: "פרק", sections: [{ paragraphs: ["   ", "טקסט אמיתי.", ""] }] },
      ],
    };
    const chunks = chunkBook(src);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe("טקסט אמיתי.");
  });
});
