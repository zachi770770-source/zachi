import { describe, it, expect } from "vitest";

import { authorContent } from "@/content/author";

describe("author home teaser, first person", () => {
  it("is written in the first person and opens with כתבתי", () => {
    expect(authorContent.homeTeaser.startsWith("כתבתי")).toBe(true);
    expect(authorContent.homeTeaser).toContain("רציתי ליצור ספר");
  });

  it("drops the old third-person phrasing", () => {
    expect(authorContent.homeTeaser).not.toContain("צחי חן זיהה");
  });

  it("keeps the existing heading intact", () => {
    expect(authorContent.sectionTitle).toBe("למה כתבתי את „מדייטים לאהבה”");
  });
});
