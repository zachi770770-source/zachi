import { describe, it, expect } from "vitest";

import { guides as guidesMap } from "@/content/guides";

const guides = Object.values(guidesMap);

/**
 * „על מה שווה לשים לב עכשיו” במדריכים — סלקטיבי בכוונה: רק במדריכי אי-הודאות
 * והחזרה-לאקס (עדיפויות 2 ו-3), לא בכל מדריך. השורה חייבת להיות משפט אחד קצר.
 */

const WITH_ATTENTION = ["hot-and-cold", "getting-back-with-ex"];

describe("guides, attention line is selective and short", () => {
  it("is present exactly on the approved high-noise guides", () => {
    const withAttention = guides.filter((g) => g.attention).map((g) => g.slug).sort();
    expect(withAttention).toEqual([...WITH_ATTENTION].sort());
  });

  it("is not spread across the rest of the guides", () => {
    const others = guides.filter((g) => !WITH_ATTENTION.includes(g.slug));
    expect(others.every((g) => !g.attention)).toBe(true);
  });

  it("each attention line is a single concise sentence (<= 24 words, no em/en dash)", () => {
    for (const slug of WITH_ATTENTION) {
      const g = guides.find((x) => x.slug === slug)!;
      expect(g.attention).toBeTruthy();
      expect(g.attention!.split(/\s+/).length).toBeLessThanOrEqual(24);
      expect(g.attention!).not.toMatch(/[—–]/);
    }
  });
});
