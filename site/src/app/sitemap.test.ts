import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import { guideOrder, guides } from "@/content/guides";
import { methodOrder, methods } from "@/content/methods";

/**
 * `lastmod` הוא הצהרה על מתי התוכן השתנה — לא על מתי פרסנו.
 *
 * הרגרסיה שנסגרה כאן: עמודים ללא תאריך-תוכן נפלו לזמן ה-build, ולכן ה-`lastmod`
 * שלהם התחלף בכל פריסה גם בלי שינוי תוכן. הבדיקה המרכזית היא זו שמריצה את
 * המפה פעמיים ודורשת פלט זהה — היא נופלת על כל ברירת-מחדל תלוית-זמן שתחזור,
 * בלי להיות תלויה בשמות העמודים או במספרם.
 */

const DATED = new Set<string>([
  ...guideOrder.map((s) => guides[s].path),
  ...methodOrder.map((s) => methods[s].path),
]);

const pathOf = (url: string) => new URL(url).pathname;

describe("sitemap lastmod", () => {
  it("אינו משתנה בין שתי פריסות — אין ברירת-מחדל תלוית-זמן", () => {
    // השעון מוזז במפורש בין ההרצות. בלי זה שתי הקריאות ל-new Date() נופלות
    // באותה מילישנייה והבדיקה הייתה עוברת במקרה — כלומר לא מזהה כלום.
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T10:00:00.000Z"));
      const a = JSON.stringify(sitemap());
      vi.setSystemTime(new Date("2026-09-30T10:00:00.000Z"));
      const b = JSON.stringify(sitemap());
      expect(b).toBe(a);
    } finally {
      vi.useRealTimers();
    }
  });

  it("עמוד ללא תאריך-תוכן אינו נושא lastmod כלל (השמטה, לא ניחוש)", () => {
    const undated = sitemap().filter((e) => !DATED.has(pathOf(e.url)));
    expect(undated.length).toBeGreaterThan(0);
    for (const e of undated) {
      expect(e.lastModified, `${pathOf(e.url)} must not carry a lastmod`).toBeUndefined();
    }
  });

  it("מדריכים ועמודי-מושג שומרים על תאריך-התוכן האמיתי שלהם", () => {
    const byPath = new Map(sitemap().map((e) => [pathOf(e.url), e]));
    for (const slug of guideOrder) {
      const e = byPath.get(guides[slug].path);
      expect(e?.lastModified, guides[slug].path).toBeDefined();
      expect(new Date(e!.lastModified as Date).toISOString().slice(0, 10)).toBe(
        new Date(guides[slug].datePublished).toISOString().slice(0, 10),
      );
    }
    for (const slug of methodOrder) {
      const e = byPath.get(methods[slug].path);
      expect(e?.lastModified, methods[slug].path).toBeDefined();
      expect(new Date(e!.lastModified as Date).toISOString().slice(0, 10)).toBe(
        new Date(methods[slug].datePublished).toISOString().slice(0, 10),
      );
    }
  });

  it("שום lastmod אינו עתידי", () => {
    const now = Date.now();
    for (const e of sitemap()) {
      if (!e.lastModified) continue;
      expect(new Date(e.lastModified as Date).getTime(), pathOf(e.url)).toBeLessThanOrEqual(now);
    }
  });

  it("כל ערך שומר על priority ו-changefreq (הפורמט לא נשבר)", () => {
    for (const e of sitemap()) {
      expect(typeof e.priority).toBe("number");
      expect(e.changeFrequency).toBeTruthy();
    }
  });
});
