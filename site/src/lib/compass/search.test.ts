import { describe, it, expect, vi } from "vitest";

// server-only זורק מחוץ להקשר RSC; בבדיקות מנטרלים אותו.
vi.mock("server-only", () => ({}));

import { searchCompass } from "@/lib/compass/search";
import type { SqlClient } from "@/lib/compass/types";

type Row = {
  chapter_number: number;
  chapter_name: string;
  section_name: string | null;
  content: string;
  score: number;
};

function mockDb(rows: Row[], activeVersion: string | null = "fixture-v1"): SqlClient {
  return {
    async query(text: string) {
      if (/compass_book_versions\s+where status = 'active'/.test(text)) {
        return { rows: activeVersion ? [{ version: activeVersion }] : [] };
      }
      if (/ts_rank_cd/.test(text)) return { rows };
      return { rows: [] };
    },
  };
}

const row = (chapter: number, score: number): Row => ({
  chapter_number: chapter,
  chapter_name: `פרק ${chapter}`,
  section_name: "סעיף",
  content: "תוכן קטע לבדיקה.",
  score,
});

describe("searchCompass", () => {
  it("returns nothing for an empty question (no DB access)", async () => {
    const res = await searchCompass(mockDb([]), "   ");
    expect(res).toEqual({ matched: false, bookVersion: null, results: [] });
  });

  it("refuses when there is no active version", async () => {
    const res = await searchCompass(mockDb([row(1, 0.5)], null), "שאלה");
    expect(res.matched).toBe(false);
    expect(res.bookVersion).toBeNull();
    expect(res.results).toHaveLength(0);
  });

  it("drops low-score rows below the calibrated 0.3 threshold (refuses weak matches)", async () => {
    const res = await searchCompass(mockDb([row(1, 0.5), row(2, 0.2)]), "שאלה");
    expect(res.matched).toBe(true);
    expect(res.results).toHaveLength(1);
    expect(res.results.every((r) => r.score >= 0.3)).toBe(true);
  });

  it("honors COMPASS_MIN_SCORE as an override", async () => {
    const prev = process.env.COMPASS_MIN_SCORE;
    process.env.COMPASS_MIN_SCORE = "0.6";
    try {
      const res = await searchCompass(mockDb([row(1, 0.5), row(2, 0.7)]), "שאלה");
      expect(res.results).toHaveLength(1);
      expect(res.results[0].score).toBe(0.7);
    } finally {
      if (prev === undefined) delete process.env.COMPASS_MIN_SCORE;
      else process.env.COMPASS_MIN_SCORE = prev;
    }
  });

  it("returns matched:false with no content when every match is weak", async () => {
    const res = await searchCompass(mockDb([row(1, 0.003), row(2, 0.005)]), "שאלה");
    expect(res.matched).toBe(false);
    expect(res.results).toHaveLength(0);
  });

  it("caps at 5 results and at most 2 per chapter (never a whole chapter)", async () => {
    const rows = [
      row(1, 0.9),
      row(1, 0.8),
      row(1, 0.7), // צריך להיחתך (מעל 2 מאותו פרק)
      row(2, 0.6),
      row(3, 0.5),
      row(4, 0.4),
      row(5, 0.3),
    ];
    const res = await searchCompass(mockDb(rows), "שאלה");
    expect(res.results.length).toBeLessThanOrEqual(5);
    const chapter1 = res.results.filter((r) => r.chapterNumber === 1);
    expect(chapter1.length).toBeLessThanOrEqual(2);
  });

  it("rejects (does not swallow) a database failure", async () => {
    const failing: SqlClient = {
      async query() {
        throw new Error("db down");
      },
    };
    await expect(searchCompass(failing, "שאלה")).rejects.toThrow(/db down/);
  });
});
