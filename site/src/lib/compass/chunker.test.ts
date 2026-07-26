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
    });
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
