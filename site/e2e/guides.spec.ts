import { test, expect, type Page } from "@playwright/test";

/**
 * אשכול-התוכן „לפני קשר” — ארבעה מדריכים (/guide/*). רגרסיה מלאה: כל מאמר עולה,
 * canonical עצמי נכון, title/meta ייחודיים, H1 יחיד, נמצא ב-sitemap, קישורים
 * פנימיים פתירים, אין ניסוח טרום-השקה, אין קישור /waitlist, ה-CTA לאמזון עובד,
 * schema מסוג Article, פירורי-לחם, ופריסת מובייל ללא גלישה אופקית. עמוד-האם
 * /before-relationship מקשר לכל הארבעה (hub).
 */

const ASIN = "B0GJ3SL9H2";

const GUIDES = [
  { path: "/guide/finding-a-relationship", h1: "איך למצוא זוגיות בלי להפוך כל דייט למבחן" },
  { path: "/guide/choosing-a-partner", h1: "איך לבחור בן או בת זוג — ומה באמת כדאי לבדוק" },
  { path: "/guide/relationship-doubts", h1: "ספקות בזוגיות: איך יודעים אם זה פחד או חוסר התאמה" },
  { path: "/guide/compatibility", h1: "התאמה זוגית: מה באמת חשוב יותר מפרפרים בבטן" },
];

const FORBIDDEN = [
  "לפני שהוא יוצא",
  "קבלו עדכון כשהספר יוצא",
  "כשהספר יוצא",
  "המכירה תיפתח בקרוב",
  "רשימת ההמתנה",
];

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

test.describe("guide cluster — each article", () => {
  for (const g of GUIDES) {
    test(`${g.path}: 200, one H1, self-canonical, Article schema, breadcrumb, CTAs, no stale/waitlist`, async ({
      page,
    }) => {
      const res = await page.goto(g.path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${g.path} status`).toBe(200);

      // H1 יחיד ותואם.
      const h1s = await page.locator("h1").allInnerTexts();
      expect(h1s.length, `${g.path} one h1`).toBe(1);
      expect(h1s[0].trim()).toBe(g.h1);

      // canonical עצמי.
      const canonical = await page
        .locator('link[rel="canonical"]')
        .first()
        .getAttribute("href");
      expect(new URL(canonical!).pathname.replace(/\/+$/, "")).toBe(g.path);

      // title + description קיימים.
      expect((await page.title()).length).toBeGreaterThan(10);
      const desc = await page
        .locator('meta[name="description"]')
        .first()
        .getAttribute("content");
      expect(desc && desc.length, `${g.path} description`).toBeGreaterThan(20);

      // Article structured data.
      const blocks = await ldjson(page);
      expect(
        blocks.some((b) => b["@type"] === "Article"),
        `${g.path} has Article JSON-LD`,
      ).toBe(true);
      expect(
        blocks.some((b) => b["@type"] === "BreadcrumbList"),
        `${g.path} has BreadcrumbList JSON-LD`,
      ).toBe(true);

      // פירורי-לחם נגישים (בית → לפני קשר → …).
      await expect(page.getByRole("navigation", { name: "פירורי לחם" })).toBeVisible();

      // קישורים פנימיים חיוניים: עמוד-האם, העוזר, ו-CTA אמזון אמיתי.
      await expect(page.locator('a[href="/before-relationship"]').first()).toBeVisible();
      await expect(page.locator('a[href^="/compass"]').first()).toBeVisible();
      const amazon = page.locator(`a[href*="amazon.com/dp/${ASIN}"]`).first();
      await expect(amazon).toHaveAttribute("target", "_blank");
      await expect(amazon).toHaveAttribute("rel", /noopener/);

      // אין קישור /waitlist ואין ניסוח טרום-השקה.
      await expect(page.locator('a[href="/waitlist"]')).toHaveCount(0);
      const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      for (const phrase of FORBIDDEN) {
        expect(body, `${g.path} must not contain "${phrase}"`).not.toContain(phrase);
      }
    });

    test(`${g.path}: mobile 390 has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(g.path, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${g.path} @390 overflow`).toBeLessThanOrEqual(0);
    });
  }

  test("all four guides are in the sitemap", async ({ page }) => {
    const xml = await (await page.request.get("/sitemap.xml")).text();
    for (const g of GUIDES) {
      expect(xml, `sitemap missing ${g.path}`).toContain(`${g.path}</loc>`);
    }
  });

  test("guide titles are unique among the cluster and vs home/book", async ({ page }) => {
    const titles = new Set<string>();
    for (const p of [...GUIDES.map((g) => g.path), "/", "/book"]) {
      await page.goto(p, { waitUntil: "domcontentloaded" });
      const t = await page.title();
      expect(titles.has(t), `duplicate title at ${p}: ${t}`).toBe(false);
      titles.add(t);
    }
  });

  test("internal links on each guide resolve (no broken /links)", async ({ page }) => {
    for (const g of GUIDES) {
      await page.goto(g.path, { waitUntil: "domcontentloaded" });
      const hrefs = await page
        .locator('main a[href^="/"], article a[href^="/"]')
        .evaluateAll((els) =>
          Array.from(new Set(els.map((el) => el.getAttribute("href") ?? ""))).filter(Boolean),
        );
      for (const href of hrefs) {
        const base = href.split("#")[0].split("?")[0];
        if (!base || base === "/") continue;
        const r = await page.request.get(base);
        expect(r.status(), `${g.path} → ${href} resolves`).toBeLessThan(400);
      }
    }
  });

  test("hub /before-relationship links to all four guides", async ({ page }) => {
    await page.goto("/before-relationship", { waitUntil: "domcontentloaded" });
    for (const g of GUIDES) {
      await expect(
        page.locator(`a[href="${g.path}"]`).first(),
        `hub links to ${g.path}`,
      ).toBeVisible();
    }
  });
});
