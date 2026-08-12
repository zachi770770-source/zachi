import { test, expect, type Page } from "@playwright/test";

/**
 * עמודי-מושג /method/* — ההגדרות הקנוניות של הכלים המקוריים של הספר. רגרסיה:
 * עולה, H1 יחיד, canonical עצמי, schema DefinedTerm (מחובר לישות הספר) + Article
 * (author/about ב-@id) + Breadcrumb, קישור לכלי בעמוד הספר (#tool-<id>), מדריכים
 * מיישמים, CTA לאמזון, אין ניסוח טרום-השקה, וב-sitemap.
 */

const ASIN = "B0GJ3SL9H2";

const METHODS = [
  { path: "/method/quiet-check", h1: "„בדיקת השקט” — להפריד בין שקט לדחייה", tool: "quiet-check" },
  { path: "/method/core-values", h1: "„קו אדום מול גמישות” — שלושה ערכי-ברזל", tool: "boundary-ladder" },
  { path: "/method/fact-story", h1: "„עובדה, סיפור, פעולה” — לעצור פרשנות לפני שהיא פוגעת", tool: "fact-story-action" },
];

const FORBIDDEN = ["כשהספר יוצא", "המכירה תיפתח בקרוב", "רשימת ההמתנה"];

async function ldjson(page: Page): Promise<Record<string, unknown>[]> {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  const out: Record<string, unknown>[] = [];
  for (const r of raw) {
    try {
      out.push(JSON.parse(r));
    } catch {
      /* ignore */
    }
  }
  return out;
}

test.describe("method (concept) pages", () => {
  for (const m of METHODS) {
    test(`${m.path}: 200, one H1, self-canonical, DefinedTerm+Article+Breadcrumb, book-tool link`, async ({
      page,
    }) => {
      const res = await page.goto(m.path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${m.path} status`).toBe(200);

      const h1s = await page.locator("h1").allInnerTexts();
      expect(h1s.length, `${m.path} one h1`).toBe(1);
      expect(h1s[0].trim()).toBe(m.h1);

      const canonical = await page
        .locator('link[rel="canonical"]')
        .first()
        .getAttribute("href");
      expect(new URL(canonical!).pathname.replace(/\/+$/, "")).toBe(m.path);

      const blocks = await ldjson(page);
      // DefinedTerm מחובר לישות הספר.
      const term = blocks.find((b) => b["@type"] === "DefinedTerm") as
        | Record<string, unknown>
        | undefined;
      expect(term, `${m.path} has DefinedTerm`).toBeTruthy();
      expect((term?.subjectOf as Record<string, string>)?.["@id"]).toContain("/book#book");
      // Article מחובר למחבר ולספר.
      const article = blocks.find((b) => b["@type"] === "Article") as
        | Record<string, Record<string, string>>
        | undefined;
      expect(article?.author?.["@id"]).toContain("/author#person");
      expect(article?.about?.["@id"]).toContain("/book#book");
      expect(blocks.some((b) => b["@type"] === "BreadcrumbList")).toBe(true);

      // קישור לכלי בעמוד הספר (עוגן) + קישור לאמזון אמיתי.
      await expect(page.locator(`a[href="/book#tool-${m.tool}"]`).first()).toBeVisible();
      const amazon = page.locator(`a[href*="amazon.com/dp/${ASIN}"]`).first();
      await expect(amazon).toHaveAttribute("target", "_blank");
      await expect(amazon).toHaveAttribute("rel", /noopener/);

      // לפחות מדריך אחד מיישם + עוזר.
      await expect(page.locator('a[href^="/guide/"]').first()).toBeVisible();

      await expect(page.locator('a[href="/waitlist"]')).toHaveCount(0);
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      for (const phrase of FORBIDDEN) {
        expect(body, `${m.path} must not contain "${phrase}"`).not.toContain(phrase);
      }
    });

    test(`${m.path}: mobile 390 has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(m.path, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${m.path} @390 overflow`).toBeLessThanOrEqual(1);
    });
  }

  test("all method pages are in the sitemap", async ({ page }) => {
    const xml = await (await page.request.get("/sitemap.xml")).text();
    for (const m of METHODS) {
      expect(xml, `sitemap missing ${m.path}`).toContain(`${m.path}</loc>`);
    }
  });

  test("method↔guide bidirectional linking", async ({ page }) => {
    // עמוד-מושג מקשר למדריך, והמדריך חזרה למושג (דרך קישור /method/*).
    await page.goto("/method/quiet-check", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href="/guide/hot-and-cold"]').first()).toBeVisible();
    await page.goto("/guide/hot-and-cold", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href="/method/quiet-check"]').first()).toBeVisible();
  });
});
