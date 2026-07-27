import { describe, it, expect } from "vitest";

import { orderPageLines, type PositionedText } from "@/lib/compass/extract/reading-order";
import { cleanPages, fixLetterSpacing } from "@/lib/compass/extract/clean";
import {
  parseHeading,
  linesToParagraphs,
  detectStructure,
  summarizeStructure,
  type CleanPage,
} from "@/lib/compass/extract/structure";

describe("orderPageLines (RTL reading order)", () => {
  it("orders items within a line right-to-left and lines top-to-bottom", () => {
    // שתי שורות; בכל שורה שני פריטים. X גדל שמאלה, Y גדל למעלה.
    const items: PositionedText[] = [
      { str: "שלום", x: 400, y: 100, height: 12 }, // ימין, שורה עליונה
      { str: "עולם", x: 200, y: 100, height: 12 }, // שמאל, שורה עליונה
      { str: "טוב", x: 400, y: 80, height: 12 }, // ימין, שורה תחתונה
      { str: "בוקר", x: 200, y: 80, height: 12 }, // שמאל, שורה תחתונה
    ];
    expect(orderPageLines(items)).toEqual(["שלום עולם", "טוב בוקר"]);
  });

  it("clusters items with small Y jitter into the same line", () => {
    const items: PositionedText[] = [
      { str: "א", x: 300, y: 100.3, height: 12 },
      { str: "ב", x: 200, y: 99.7, height: 12 },
    ];
    expect(orderPageLines(items)).toEqual(["א ב"]);
  });

  it("drops whitespace-only items and returns [] for an empty page", () => {
    expect(orderPageLines([{ str: "   ", x: 0, y: 0, height: 12 }])).toEqual([]);
    expect(orderPageLines([])).toEqual([]);
  });
});

describe("fixLetterSpacing", () => {
  it("joins justified single-letter runs but leaves normal words alone", () => {
    expect(fixLetterSpacing("ש ל ו ם עולם")).toBe("שלום עולם");
    expect(fixLetterSpacing("קשר טוב ובריא")).toBe("קשר טוב ובריא");
  });
});

describe("cleanPages", () => {
  it("removes page numbers, running headers and consecutive duplicates", () => {
    const header = "מדייטים לאהבה";
    const pages: string[][] = [
      [header, "תוכן ראשון של העמוד.", "42"],
      [header, "תוכן שני של העמוד.", "43"],
      [header, "תוכן שלישי.", "תוכן שלישי.", "44"],
      [header, "תוכן רביעי.", "45"],
    ];
    const cleaned = cleanPages(pages);
    // הכותרת הרצה הוסרה מכל עמוד; מספרי העמוד הוסרו; הכפילות אוחדה.
    expect(cleaned[0]).toEqual(["תוכן ראשון של העמוד."]);
    expect(cleaned[2]).toEqual(["תוכן שלישי."]);
    for (const page of cleaned) {
      expect(page).not.toContain(header);
      expect(page.some((l) => /^\d+$/.test(l))).toBe(false);
    }
  });
});

describe("parseHeading", () => {
  it("recognizes chapter headings with digit and Hebrew-ordinal numbers", () => {
    expect(parseHeading("פרק 3: מתחילים לבנות")).toMatchObject({
      type: "chapter",
      chapterNumber: 3,
      name: "מתחילים לבנות",
    });
    expect(parseHeading("פרק ראשון")).toMatchObject({ type: "chapter", chapterNumber: 1 });
    expect(parseHeading("פרק שלושה עשר")).toMatchObject({
      type: "chapter",
      chapterNumber: 13,
    });
  });

  it("recognizes intro / conclusion / appendix and rejects body text", () => {
    expect(parseHeading("מבוא")?.type).toBe("intro");
    expect(parseHeading("אחרית דבר")?.type).toBe("conclusion");
    expect(parseHeading("נספח א")?.type).toBe("appendix");
    // משפט גוף רגיל אינו כותרת (מסתיים בנקודה, ארוך).
    expect(parseHeading("זהו משפט גוף רגיל שמסתיים בנקודה.")).toBeNull();
  });
});

describe("linesToParagraphs", () => {
  it("rejoins wrapped lines and breaks at sentence boundaries", () => {
    const lines = ["ההקשבה היא", "המפתח לקשר.", "היא דורשת תרגול."];
    expect(linesToParagraphs(lines)).toEqual([
      "ההקשבה היא המפתח לקשר.",
      "היא דורשת תרגול.",
    ]);
  });
});

describe("detectStructure", () => {
  it("derives intro/chapters/conclusion parts with page ranges from headings only", () => {
    const pages: CleanPage[] = [
      { pageNumber: 1, lines: ["מבוא", "פתיחה קצרה לספר."] },
      { pageNumber: 2, lines: ["פרק 1: מזהים את הרעש", "הרעש מנהל אותנו."] },
      { pageNumber: 3, lines: ["פרק 2: עוברים את השער", "אפשר לבדוק בשלווה."] },
      { pageNumber: 4, lines: ["אחרית דבר", "מסע ולא יעד."] },
    ];
    const src = detectStructure(pages, { version: "t", title: "ספר" });
    expect(summarizeStructure(src)).toEqual({
      intro: 1,
      chapter: 2,
      conclusion: 1,
      appendix: 0,
    });
    const intro = src.chapters[0];
    expect(intro.type).toBe("intro");
    expect(intro.sections[0].pageStart).toBe(1);
    const ch2 = src.chapters[2];
    expect(ch2.type).toBe("chapter");
    expect(ch2.number).toBe(2);
    expect(ch2.sections[0].paragraphs).toContain("אפשר לבדוק בשלווה.");
  });

  it("wraps pre-heading content as intro so no text is lost", () => {
    const pages: CleanPage[] = [
      { pageNumber: 1, lines: ["טקסט לפני כל כותרת."] },
      { pageNumber: 2, lines: ["פרק 1", "גוף הפרק."] },
    ];
    const src = detectStructure(pages, { version: "t" });
    expect(src.chapters[0].type).toBe("intro");
    expect(src.chapters[0].sections[0].paragraphs).toContain("טקסט לפני כל כותרת.");
  });
});
