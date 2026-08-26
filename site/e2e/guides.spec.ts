import { test, expect, type Page } from "@playwright/test";

/**
 * אשכולי-התוכן /guide/* — רגרסיה מלאה לכל מדריך: עולה, canonical עצמי, title/meta
 * ייחודיים, H1 יחיד, נמצא ב-sitemap, קישור לעמוד-האם (ה-hub שלו), לעוזר ולאמזון,
 * schema מסוג Article + Breadcrumb, פירורי-לחם, ופריסת מובייל ללא גלישה. כל תחנה
 * (hub) מקשרת למדריכים ששויכו אליה.
 */

const ASIN = "B0GJ3SL9H2";

const GUIDES = [
  { path: "/guide/finding-a-relationship", h1: "איך למצוא זוגיות בלי להפוך כל דייט למבחן", hub: "/before-relationship" },
  { path: "/guide/choosing-a-partner", h1: "איך לבחור בן או בת זוג, ומה באמת כדאי לבדוק", hub: "/before-relationship" },
  { path: "/guide/relationship-doubts", h1: "ספקות בזוגיות: איך יודעים אם זה פחד או חוסר התאמה", hub: "/before-relationship" },
  { path: "/guide/compatibility", h1: "התאמה זוגית: מה באמת חשוב יותר מפרפרים בבטן", hub: "/before-relationship" },
  { path: "/guide/healthy-relationship", h1: "מהי מערכת יחסים בריאה, ואיך יודעים שאתם בונים אחת", hub: "/inside-relationship" },
  { path: "/guide/dating-red-flags", h1: "דגלים אדומים בדייטים, ומה באמת נחשב קו אדום", hub: "/before-relationship" },
  { path: "/guide/getting-back-with-ex", h1: "חזרה לאקס: איך יודעים אם זה נכון", hub: "/after-breakup" },
  { path: "/guide/fear-of-commitment", h1: "פחד ממחויבות, שלך או של בן/בת הזוג", hub: "/building-relationship" },
  { path: "/guide/couple-communication", h1: "תקשורת זוגית: לומר מה מרגישים בלי להאשים", hub: "/inside-relationship" },
  { path: "/guide/attracted-to-unavailable", h1: "למה אני נמשך/ת לאנשים לא זמינים", hub: "/before-relationship" },
  { path: "/guide/recurring-fights", h1: "ריבים חוזרים: איך יוצאים מהלולאה", hub: "/inside-relationship" },
  { path: "/guide/how-to-end-a-relationship", h1: "לסיים קשר בכבוד, בלי היעלמות", hub: "/starting-again" },
  { path: "/guide/how-fast-is-too-fast", h1: "כמה מהר זה מהר מדי בתחילת קשר", hub: "/building-relationship" },
  { path: "/guide/defining-the-relationship", h1: "בלעדיות: מתי ואיך מדברים על „מה אנחנו”", hub: "/building-relationship" },
  { path: "/guide/hot-and-cold", h1: "חם-קר בקשר: כשמישהו מתקרב ומתרחק", hub: "/building-relationship" },
  { path: "/guide/over-a-breakup", h1: "איך יודעים שסיימתי לעבד פרידה", hub: "/after-breakup" },
  { path: "/guide/words-vs-actions", h1: "כשיש פער בין המילים למעשים", hub: "/inside-relationship" },
  { path: "/guide/ready-for-a-relationship", h1: "האם אני מוכן/ה לזוגיות", hub: "/before-relationship" },
  { path: "/guide/keeping-connection-alive", h1: "לשמור על קרבה ותשוקה אחרי שהשגרה נכנסת", hub: "/inside-relationship" },
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

test.describe("guide cluster, each article", () => {
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

      // Article + Breadcrumb structured data.
      const blocks = await ldjson(page);
      expect(
        blocks.some((b) => b["@type"] === "Article"),
        `${g.path} has Article JSON-LD`,
      ).toBe(true);
      expect(
        blocks.some((b) => b["@type"] === "BreadcrumbList"),
        `${g.path} has BreadcrumbList JSON-LD`,
      ).toBe(true);
      // Article מחובר לישות המחבר (author @id) ולישות הספר (about @id).
      const article = blocks.find((b) => b["@type"] === "Article") as
        | Record<string, Record<string, string>>
        | undefined;
      expect(article?.author?.["@id"]).toContain("/author#person");
      expect(article?.about?.["@id"]).toContain("/book#book");

      // פירורי-לחם נגישים.
      await expect(page.getByRole("navigation", { name: "פירורי לחם" })).toBeVisible();

      // קישורים פנימיים חיוניים: עמוד-האם (ה-hub של המדריך), העוזר, ו-CTA אמזון.
      await expect(page.locator(`a[href="${g.hub}"]`).first()).toBeVisible();
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
      expect(overflow, `${g.path} @390 overflow`).toBeLessThanOrEqual(1);
    });
  }

  test("all guides are in the sitemap", async ({ page }) => {
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

  test("sample link deep-links to the guide's book tool (opens the tool excerpt)", async ({
    page,
  }) => {
    for (const g of GUIDES) {
      await page.goto(g.path, { waitUntil: "domcontentloaded" });
      const href = await page
        .getByRole("link", { name: "לקריאת טעימה מהספר" })
        .first()
        .getAttribute("href");
      expect(href, `${g.path} has a sample link`).toBeTruthy();
      // מדריכים עם כלי-ספר → deep-link ל-/preview עם tool+station; פותח בפועל
      // את קטע הכלי הממוקד (‎.reader-context מוצג רק כשהטעימה מותאמת-כלי).
      if (href!.includes("tool=")) {
        expect(href, `${g.path} deep-link has station`).toContain("station=");
        const res = await page.goto(href!, { waitUntil: "domcontentloaded" });
        expect(res?.status(), `${g.path} preview deep-link 200`).toBe(200);
        await expect(
          page.locator(".reader-context"),
          `${g.path} deep-link renders the tool excerpt`,
        ).toBeVisible();
      }
    }
  });

  test("each station hub links to the guides assigned to it", async ({ page }) => {
    const hubs = Array.from(new Set(GUIDES.map((g) => g.hub)));
    for (const hub of hubs) {
      await page.goto(hub, { waitUntil: "domcontentloaded" });
      // מצומצם לאשכול-המדריכים (StationGuides) — לא לכל העמוד: „רגע של מראה”
      // מוסיף כעת קישורי /guide/* משלו, שמוסתרים ב-CSS עד בחירה, ואין לבלבל
      // אותם עם הקישור הגלוי של אשכול ה-hub→spoke.
      const cluster = page.locator('section[aria-labelledby="guides-heading"]');
      for (const g of GUIDES.filter((x) => x.hub === hub)) {
        await expect(
          cluster.locator(`a[href="${g.path}"]`).first(),
          `${hub} links to ${g.path}`,
        ).toBeVisible();
      }
    }
  });
});
