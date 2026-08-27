import { describe, it, expect } from "vitest";

import { focusSituations, getFocusSituation, focusUi } from "@/content/focusMode";
import { homePaths } from "@/content/homePaths";
import { journeyPages } from "@/content/journeyPages";
import { methods } from "@/content/methods";

/**
 * Focus Mode אינו יוצר תוכן חדש: כל מחרוזת חייבת להגיע ממקור-אמת קיים. הבדיקה
 * נכשלת אם עובדה/סיפור/גשר יינתקו מהמקורות (methods / journeyPages / homePaths).
 */
describe("focusMode content — provenance only, no invention", () => {
  const lab = methods["fact-story"].factStory!;

  it("covers exactly the four home situations", () => {
    expect(focusSituations.map((s) => s.id)).toEqual(homePaths.map((p) => p.id));
  });

  it("every fact comes from factStory.moments and every story from factStory.stories", () => {
    const facts = lab.moments.map((m) => m.fact);
    for (const s of focusSituations) {
      expect(facts).toContain(s.fact);
      expect(lab.stories).toContain(s.story);
    }
  });

  it("every bridge is a canonical journey pullQuote", () => {
    const quotes = Object.values(journeyPages).map((j) => j.pullQuote);
    for (const s of focusSituations) {
      expect(quotes).toContain(s.bridge);
    }
  });

  it("title and station link mirror homePaths", () => {
    for (const p of homePaths) {
      const s = getFocusSituation(p.id);
      expect(s.title).toBe(p.buttonTitle);
      expect(s.stationHref).toBe(p.stationHref);
      expect(s.stationLabel).toBe(p.stationLabel);
    }
  });

  it("the Aha line and tags are the fact-story lab's own strings", () => {
    expect(focusUi.separationLine).toBe(lab.separationLine);
    expect(focusUi.factTag).toBe(lab.factTag);
    expect(focusUi.storyTag).toBe(lab.storyTag);
  });
});
