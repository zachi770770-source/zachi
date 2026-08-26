import { describe, it, expect } from "vitest";

import { journeyInteractions } from "@/content/journeyInteractions";
import { journeyPages, type JourneyId } from "@/content/journeyPages";
import { methods } from "@/content/methods";

/**
 * „פעולה קטנה אחת” לכל תחנה — שלמות ה-data: לכל אחת מחמש התחנות interaction
 * ייחודי ותקין, עם לפחות שאלה אחת, לפחות שתי בחירות לכל שאלה, ולכל בחירה תווית
 * ושיקוף. מושג מלווה (אם קיים) הוא אחד מששת הכלים הקנוניים בלבד.
 */

const STATIONS = Object.keys(journeyPages) as JourneyId[];
const CANONICAL = ["quiet-check", "fact-story", "core-values", "pace-check", "eye-level-talk", "clean-exit"];

describe("journey interactions — data integrity", () => {
  it("every one of the five stations has an interaction", () => {
    expect(STATIONS).toHaveLength(5);
    for (const id of STATIONS) {
      expect(journeyInteractions[id], id).toBeDefined();
    }
  });

  it("each interaction is well-formed (title, intro, items, choices with a reflection)", () => {
    for (const id of STATIONS) {
      const it_ = journeyInteractions[id];
      expect(it_.title.trim().length, `${id} title`).toBeGreaterThan(0);
      expect(it_.intro.trim().length, `${id} intro`).toBeGreaterThan(0);
      expect(it_.closing.trim().length, `${id} closing`).toBeGreaterThan(0);
      expect(it_.items.length, `${id} items`).toBeGreaterThanOrEqual(1);
      for (const item of it_.items) {
        expect(item.prompt.trim().length, `${id} prompt`).toBeGreaterThan(0);
        // אינטראקציה, לא תצוגה: לפחות שתי בחירות אמיתיות לכל שאלה.
        expect(item.choices.length, `${id} choices`).toBeGreaterThanOrEqual(2);
        for (const choice of item.choices) {
          expect(choice.label.trim().length, `${id} label`).toBeGreaterThan(0);
          expect(choice.reflection.trim().length, `${id} reflection`).toBeGreaterThan(0);
        }
        // תוויות הבחירות בתוך שאלה נבדלות זו מזו (radiogroup אמיתי).
        const labels = item.choices.map((c) => c.label);
        expect(new Set(labels).size, `${id} distinct labels`).toBe(labels.length);
      }
    }
  });

  it("uses only the six canonical tools for the accompanying concept — never a seventh", () => {
    for (const id of STATIONS) {
      const slug = journeyInteractions[id].methodSlug;
      if (slug) {
        expect(CANONICAL, `${id} methodSlug`).toContain(slug);
        expect(methods[slug], `${id} method exists`).toBeDefined();
      }
    }
  });

  it("each station's interaction is unique (distinct title + first prompt)", () => {
    const titles = STATIONS.map((id) => journeyInteractions[id].title);
    const prompts = STATIONS.map((id) => journeyInteractions[id].items[0].prompt);
    expect(new Set(titles).size, "distinct titles").toBe(5);
    expect(new Set(prompts).size, "distinct first prompts").toBe(5);
  });
});
