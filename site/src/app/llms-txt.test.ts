import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";

/**
 * `public/llms.txt` הוא אינדקס-קישורים מתוחזק ביד, בלי שום קשר לקוד — ולכן הוא
 * נוטה להתיישן בשקט: הוא לא נשבר, לא נכשל בבנייה, ואף אחד לא שם לב.
 *
 * זה כבר קרה בפועל: `/love` — עמוד-הסמכות הרוחבי של אשכול „אהבה וזוגיות”
 * ובעל priority 0.9 (שני רק לעמוד הבית, בדיוק כמו `/book`) — נוסף לאתר ולא
 * נוסף לקובץ.
 *
 * הבדיקה אינה דורשת שהקובץ יהיה ממצה. llms.txt הוא אינדקס *מובחר* מעצם
 * הגדרתו, ועמודים משניים יכולים ולגיטימי שיישארו בחוץ. שתי התכונות שכן חייבות
 * להתקיים:
 *   1. כל כתובת שמופיעה בו קיימת באמת במפת-האתר — אין קישורים מתים.
 *   2. עמוד בעל priority ≥ 0.8 (עמודי-העוגן של האתר) אינו נושר ממנו בשקט.
 */

const LLMS = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf8");

/**
 * `llms.txt` הוא קובץ סטטי שכתוב בכתובות מוחלטות — ולכן הדומיין כאן קבוע
 * במכוון, ולא נלקח מ-`siteConfig.url`: זה נפתר לפי הסביבה (localhost תחת
 * vitest) ולא היה מתאים אף פעם לכתובות שבקובץ.
 */
const CANONICAL_ORIGIN = "https://www.zachi.co.il";

/** כל הכתובות המוחלטות שמופיעות בקובץ. */
const listedUrls = (): URL[] =>
  [...LLMS.matchAll(/https?:\/\/[^\s)\]]+/g)].map((m) => new URL(m[0]));

/** כתובות האתר עצמו (לא אמזון), כנתיבים מנורמלים. */
const listedPaths = (): string[] =>
  listedUrls()
    .filter((u) => u.origin === CANONICAL_ORIGIN)
    .map((u) => u.pathname.replace(/\/+$/, "") || "/");

/** נתיבי מפת-האתר, מנורמלים באותה צורה. */
const sitemapEntries = () =>
  sitemap().map((e) => ({
    path: new URL(e.url).pathname.replace(/\/+$/, "") || "/",
    priority: e.priority ?? 0,
  }));

describe("llms.txt stays in step with the sitemap", () => {
  it("מפרט לפחות כתובת אחת (הקובץ לא רוקן בטעות)", () => {
    expect(listedPaths().length).toBeGreaterThan(10);
  });

  it("כל כתובת שמופיעה בו קיימת במפת-האתר — אין קישורים מתים", () => {
    const known = new Set(sitemapEntries().map((e) => e.path));
    const dead = [...new Set(listedPaths())].filter((p) => !known.has(p));
    expect(dead, `llms.txt lists paths that are not in the sitemap: ${dead.join(", ")}`).toEqual([]);
  });

  it("אף עמוד-עוגן (priority ≥ 0.8) אינו נושר ממנו בשקט", () => {
    const listed = new Set(listedPaths());
    const missing = sitemapEntries()
      .filter((e) => e.priority >= 0.8)
      .map((e) => e.path)
      .filter((p) => !listed.has(p));
    expect(
      missing,
      `high-priority pages missing from llms.txt: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("אינו מפרט את אותה כתובת פעמיים", () => {
    const all = listedPaths();
    const dupes = all.filter((p, i) => all.indexOf(p) !== i);
    expect([...new Set(dupes)], `duplicated in llms.txt: ${dupes.join(", ")}`).toEqual([]);
  });

  it("אינו מפרט נתיבים שאינם-תוכן (checkout / thank-you / api)", () => {
    const bad = listedPaths().filter((p) => /^\/(api|checkout|thank-you)/.test(p));
    expect(bad, `non-content paths must not be advertised: ${bad.join(", ")}`).toEqual([]);
  });

  it("כל קישור פנימי משתמש במקור הקנוני (www + https)", () => {
    const offOrigin = listedUrls()
      .filter((u) => u.host.endsWith("zachi.co.il") && u.origin !== CANONICAL_ORIGIN)
      .map((u) => u.href);
    expect(
      [...new Set(offOrigin)],
      `internal links must use ${CANONICAL_ORIGIN}: ${offOrigin.join(", ")}`,
    ).toEqual([]);
  });
});
