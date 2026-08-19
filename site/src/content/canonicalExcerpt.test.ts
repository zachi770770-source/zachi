import { describe, it, expect } from "vitest";

import { canonicalExcerpt } from "@/content/sample";

/**
 * מגן על שלמות הקטע הקנוני של /preview (גרסה 888, מבוא: „החלק השני של האהבה”).
 * הטקסט מאושר ע"י המחבר ומועתק מילה-במילה; הבדיקות האלה קיימות כדי שמשפט-הפתיחה,
 * משפט-הסיום, מספר הפסקאות והרצף לא ישוכתבו או ייחתכו בטעות בעתיד.
 */

const OPENING =
  "מאוחר מדי, בכמה קשרים שכבר לא יכולתי להציל, הבנתי שלא חסר לי רצון לאהוב, ולא בהכרח פגשתי את האנשים הלא נכונים.";

const CLOSING =
  "אלא כשבונים קשר שיש בו אמת ונוכחות.";

describe("canonical /preview excerpt integrity (גרסה 888, מבוא)", () => {
  it("has exactly nine continuous paragraphs, none empty, none duplicated", () => {
    expect(canonicalExcerpt.paragraphs).toHaveLength(9);
    for (const p of canonicalExcerpt.paragraphs) {
      expect(p.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(canonicalExcerpt.paragraphs).size).toBe(9);
  });

  it("opening sentence is exact and unchanged", () => {
    expect(canonicalExcerpt.paragraphs[0].startsWith(OPENING)).toBe(true);
  });

  it("closing sentence is exact and unchanged", () => {
    expect(canonicalExcerpt.paragraphs[8].endsWith(CLOSING)).toBe(true);
  });

  it("preserves the book's core anchor lines verbatim (not summarized or normalized)", () => {
    const full = canonicalExcerpt.paragraphs.join("\n");
    expect(full).toContain("דייטינג הוא חיפוש; אהבה היא בנייה.");
    expect(full).toContain("מהדייט הראשון ועד שנת הנישואים העשרים");
    expect(full).toContain("פרק ב׳");
    // ציטוט פנימי עם מירכאות ישרות — לא לנרמל לגרשיים מסולסלים.
    expect(full).toContain('"יש כאן משהו"');
  });

  it("is sized as a real 3–5 minute reading (~725 words)", () => {
    const words = canonicalExcerpt.paragraphs
      .join(" ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(680);
    expect(words).toBeLessThanOrEqual(770);
  });

  it("carries the editorial framing but no marketing/CTA text inside the reading", () => {
    expect(canonicalExcerpt.title).toBe("החלק השני של האהבה");
    expect(canonicalExcerpt.source).toBe("מתוך המבוא");
    const full = canonicalExcerpt.paragraphs.join(" ");
    // אין קריאות-רכישה בתוך הקטע עצמו.
    expect(full).not.toContain("אמזון");
    expect(full).not.toContain("לרכישה");
    expect(full).not.toContain("קנו");
  });
});
