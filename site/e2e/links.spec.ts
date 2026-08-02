import { test, expect } from "@playwright/test";

/**
 * ביקורת קישורים ועוגנים מערכתית: אוספת כל <a href> פנימי מכל העמודים
 * הציבוריים (ניווט, פוטר, CTA, כרטיסים, קישורים בגוף), ומאמתת לכל אחד:
 *  (1) הראוט עצמו נטען (סטטוס < 400);
 *  (2) אם יש עוגן (#frag) — קיים אלמנט עם ה-id הזה בעמוד היעד.
 * זו הרגרסיה שתתפוס „קישור טעימה מת” / עוגן ללא יעד בעתיד.
 */

const PUBLIC_ROUTES = [
  "/",
  "/book",
  "/compass",
  "/author",
  "/preview",
  "/faq",
  "/contact",
  "/waitlist",
  "/before-relationship",
  "/starting-again",
  "/inside-relationship",
  "/terms",
  "/privacy",
  "/shipping-returns",
  "/accessibility",
];

test("every internal link across the site resolves, and every anchor has a real target", async ({
  page,
}) => {
  // 1) אוספים קישורים פנימיים מכל עמוד (וגם מאמתים ניווט ישיר לכל ראוט).
  const links = new Map<string, string>(); // href -> עמוד המקור
  for (const route of PUBLIC_ROUTES) {
    const resp = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(resp?.status(), `direct load ${route}`).toBeLessThan(400);
    const hrefs = await page.$$eval("a[href]", (els) =>
      els.map((e) => e.getAttribute("href"))
    );
    for (const h of hrefs) {
      if (!h || h.startsWith("//") || !(h.startsWith("/") || h.startsWith("#")))
        continue;
      if (!links.has(h)) links.set(h, route);
    }
  }

  // 2) ולידציה: סטטוס ראוט + קיום עוגן (עם cache למזהי-עמוד).
  const idCache = new Map<string, Set<string>>();
  async function idsOf(path: string): Promise<Set<string>> {
    const key = path || "/";
    const cached = idCache.get(key);
    if (cached) return cached;
    await page.goto(key, { waitUntil: "networkidle" });
    const ids = new Set(
      await page.$$eval("[id]", (els) => els.map((e) => e.id))
    );
    idCache.set(key, ids);
    return ids;
  }

  const broken: string[] = [];
  for (const [href, src] of links) {
    let path = href;
    let hash = "";
    const hi = href.indexOf("#");
    if (hi === 0) {
      // עוגן „ערום” (#frag) — היעד הוא העמוד הנוכחי (עמוד המקור).
      path = src;
      hash = href.slice(1);
    } else if (hi > 0) {
      path = href.slice(0, hi);
      hash = href.slice(hi + 1);
    }
    if (path === "") path = "/";

    const resp = await page.request
      .get(path, { maxRedirects: 0 })
      .catch(() => null);
    const status = resp ? resp.status() : -1;
    if (status < 200 || status >= 400) {
      broken.push(`${href} (from ${src}) → route status ${status}`);
      continue;
    }
    if (hash) {
      const ids = await idsOf(path);
      if (!ids.has(hash)) {
        broken.push(`${href} (from ${src}) → missing #${hash} on ${path}`);
      }
    }
  }

  expect(broken, `broken links/anchors:\n${broken.join("\n")}`).toEqual([]);
});

test("mobile menu links all resolve", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("header button").last().click();
  const dialog = page.locator("[role='dialog']");
  await dialog.waitFor({ state: "visible" });
  const hrefs = await dialog
    .locator("a[href]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  const internal = hrefs.filter(
    (h): h is string => !!h && h.startsWith("/") && !h.startsWith("//")
  );
  expect(internal.length).toBeGreaterThan(0);
  for (const href of internal) {
    const resp = await page.request
      .get(href.split("#")[0] || "/", { maxRedirects: 0 })
      .catch(() => null);
    expect(resp?.status(), `mobile link ${href}`).toBeLessThan(400);
  }
  await ctx.close();
});
