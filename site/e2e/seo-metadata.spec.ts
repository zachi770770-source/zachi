import { test, expect, type Page } from "@playwright/test";

/**
 * רגרסיית SEO טכני: כותרות ותיאורים ייחודיים לכל עמוד, canonical נכון, H1 יחיד,
 * כלל-אינדוקס עקבי, ותיקון ה-title הכפול של /compass. שומר על מפת-הבעלות שהוגדרה
 * ב-Phase 2 מפני נסיגה שקטה בעריכות עתידיות.
 */

const ROUTES = [
  "/",
  "/book",
  "/author",
  "/compass",
  "/preview",
  "/faq",
  "/contact",
  "/before-relationship",
  "/building-relationship",
  "/inside-relationship",
  "/after-breakup",
  "/starting-again",
  "/terms",
  "/privacy",
  "/shipping-returns",
  "/accessibility",
  "/guide/finding-a-relationship",
  "/guide/choosing-a-partner",
  "/guide/relationship-doubts",
  "/guide/compatibility",
];

const BRAND = "מדייטים לאהבה";

async function attr(page: Page, selector: string): Promise<string | null> {
  return page
    .locator(selector)
    .first()
    .getAttribute("content")
    .catch(() => null);
}

test.describe("SEO metadata regression", () => {
  test("every core route has a unique <title> and a unique meta description", async ({
    page,
  }) => {
    const titles = new Map<string, string>();
    const descs = new Map<string, string>();
    for (const r of ROUTES) {
      await page.goto(r, { waitUntil: "domcontentloaded" });
      const title = await page.title();
      const desc = await attr(page, 'meta[name="description"]');

      expect(title, `${r} has an empty <title>`).toBeTruthy();
      expect(
        titles.has(title),
        `duplicate <title> on ${r}: "${title}" (also on ${titles.get(title)})`,
      ).toBe(false);
      titles.set(title, r);

      expect(desc, `${r} has an empty meta description`).toBeTruthy();
      expect(
        descs.has(desc!),
        `duplicate meta description on ${r} (also on ${descs.get(desc!)})`,
      ).toBe(false);
      descs.set(desc!, r);
    }
  });

  test("/compass <title> carries the brand suffix exactly once (no duplication)", async ({
    page,
  }) => {
    await page.goto("/compass", { waitUntil: "domcontentloaded" });
    const title = await page.title();
    const count = title.split(BRAND).length - 1;
    expect(count, `brand appears ${count}× in /compass title: "${title}"`).toBe(1);
  });

  test("every core route has exactly one <h1> and a canonical matching its path", async ({
    page,
  }) => {
    for (const r of ROUTES) {
      await page.goto(r, { waitUntil: "domcontentloaded" });

      const h1s = await page.locator("h1").allInnerTexts();
      expect(h1s.length, `${r} should have exactly one <h1>, has ${h1s.length}`).toBe(1);
      expect(h1s[0].trim().length, `${r} <h1> is empty`).toBeGreaterThan(0);

      const canonical = await page
        .locator('link[rel="canonical"]')
        .first()
        .getAttribute("href")
        .catch(() => null);
      expect(canonical, `${r} is missing a canonical link`).toBeTruthy();
      const path = new URL(canonical!).pathname.replace(/\/+$/, "") || "/";
      expect(path, `${r} canonical points elsewhere: ${canonical}`).toBe(r);
    }
  });

  test("indexing rules are consistent across routes (preview-safe noindex gate)", async ({
    page,
  }) => {
    // בסביבה שאינה VERCEL_ENV=production כל העמודים נושאים אותו כלל robots (הגנת
    // preview: noindex,nofollow). הבדיקה מוודאת *עקביות* — שאף עמוד אינו דורס את
    // כלל-האינדוקס בנפרד. בפרודקשן הכלל מתהפך אוטומטית ל-index,follow (layout).
    const values = new Set<string>();
    for (const r of ["/", "/book", "/before-relationship", "/compass", "/faq"]) {
      await page.goto(r, { waitUntil: "domcontentloaded" });
      const robots = (await attr(page, 'meta[name="robots"]')) ?? "(none)";
      values.add(robots.replace(/\s+/g, ""));
    }
    expect(
      values.size,
      `robots meta differs across pages: ${[...values].join(" | ")}`,
    ).toBe(1);
  });

  test("core keyword ownership: each key page carries its primary term in the <title>", async ({
    page,
  }) => {
    const checks: Array<[string, RegExp]> = [
      ["/book", /ספר זוגיות|מדריך/],
      ["/author", /צחי חן/],
      ["/before-relationship", /בן או בת זוג|התאמה/],
      ["/building-relationship", /בניית קשר|תחילת קשר/],
      ["/inside-relationship", /קשר זוגי/],
      ["/after-breakup", /פרידה/],
      ["/starting-again", /לחזור לדייטים|מחדש/],
    ];
    for (const [r, re] of checks) {
      await page.goto(r, { waitUntil: "domcontentloaded" });
      expect(await page.title(), `${r} <title> should match ${re}`).toMatch(re);
    }
  });
});
