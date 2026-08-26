import { test, expect, type Page } from "@playwright/test";

/**
 * Phase A — מדידת המשפך. trackEvent הוא consent-gated ודוחף ל-window.dataLayer רק
 * כשיש הסכמת-אנליטיקה. הבדיקות מזריקות הסכמה + dataLayer מדומה לפני הטעינה, ואז
 * קוראות את האירועים. מאמתות: guide_viewed/home_viewed/book_viewed נורים *פעם
 * אחת* עם הפרמטרים הנכונים; קליק-אמזון ממדריך נושא שיוך guide; אירועי ask,
 * טעימה ומסע נשמרים; ה-consent-gate עובד; ואין PII.
 */

const CONSENT_KEY = "cookie-consent";

/** מזריק הסכמת-אנליטיקה + dataLayer אמיתי (מערך) לפני כל טעינת עמוד. */
async function withAnalytics(page: Page, analytics = true) {
  await page.addInitScript(
    ([key, granted]) => {
      try {
        window.localStorage.setItem(
          key as string,
          JSON.stringify({ necessary: true, analytics: granted, marketing: false }),
        );
      } catch {
        /* ignore */
      }
      // dataLayer אמיתי — trackEvent ידחוף לכאן (אין GA/GTM בבדיקה).
      (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
    },
    [CONSENT_KEY, analytics] as const,
  );
}

type DlEvent = Record<string, unknown> & { event?: string };

async function dataLayer(page: Page): Promise<DlEvent[]> {
  return page.evaluate(
    () => (window as unknown as { dataLayer?: DlEvent[] }).dataLayer ?? [],
  );
}

async function eventsNamed(page: Page, name: string): Promise<DlEvent[]> {
  return (await dataLayer(page)).filter((e) => e.event === name);
}

test.describe("Phase A analytics funnel", () => {
  test("guide_viewed fires exactly once with the guide slug", async ({ page }) => {
    await withAnalytics(page);
    await page.goto("/guide/relationship-doubts", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "guide_viewed",
        ),
      { timeout: 5000 },
    );
    const evs = await eventsNamed(page, "guide_viewed");
    expect(evs).toHaveLength(1);
    expect(evs[0].guide).toBe("relationship-doubts");
    // אין PII — רק המפתחות המצופים.
    expect(Object.keys(evs[0]).sort()).toEqual(["event", "guide"]);
  });

  test("home_viewed fires exactly once on /", async ({ page }) => {
    await withAnalytics(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "home_viewed",
        ),
      { timeout: 5000 },
    );
    expect(await eventsNamed(page, "home_viewed")).toHaveLength(1);
  });

  test("book_viewed fires exactly once on /book", async ({ page }) => {
    await withAnalytics(page);
    await page.goto("/book", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "book_viewed",
        ),
      { timeout: 5000 },
    );
    expect(await eventsNamed(page, "book_viewed")).toHaveLength(1);
  });

  test("guide Amazon click carries source=guide + the guide slug (no PII)", async ({
    page,
  }) => {
    await withAnalytics(page);
    // חוסמים ניווט חיצוני לאמזון; ה-trackEvent רץ ב-onClick לפני פתיחת הטאב.
    await page.route(/amazon\./, (r) => r.abort());
    page.on("popup", (p) => p.close().catch(() => {}));

    await page.goto("/guide/finding-a-relationship", { waitUntil: "domcontentloaded" });
    const amazon = page
      .locator('a[href*="amazon.com/dp/B0GJ3SL9H2"]')
      .first();
    await amazon.click();

    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "amazon_purchase_clicked",
        ),
      { timeout: 5000 },
    );
    const evs = await eventsNamed(page, "amazon_purchase_clicked");
    expect(evs.length).toBeGreaterThanOrEqual(1);
    const e = evs[0];
    expect(e.source).toBe("guide");
    expect(e.cta_location).toBe("guide");
    expect(e.source_detail).toBe("finding-a-relationship");
    // מימדי-השיוך שנוספו — כולם מזהים, ללא PII.
    expect(e.page_path).toBe("/guide/finding-a-relationship");
    expect(String(e.destination_url)).toContain("amazon.com/dp/B0GJ3SL9H2");
    expect(e.book_format).toBe("kindle");
    // אין PII — רק מזהים/מימדי-שיוך.
    expect(Object.keys(e).sort()).toEqual([
      "book_format",
      "cta_location",
      "destination_url",
      "event",
      "page_path",
      "source",
      "source_detail",
    ]);
  });

  test("existing analytics intact: journey_page_viewed, preview events, ask_open", async ({
    page,
  }) => {
    await withAnalytics(page);

    await page.goto("/before-relationship", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "journey_page_viewed",
        ),
      { timeout: 5000 },
    );
    expect((await eventsNamed(page, "journey_page_viewed")).length).toBeGreaterThanOrEqual(1);

    await page.goto("/preview", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "view_sample",
        ),
      { timeout: 5000 },
    );
    expect((await eventsNamed(page, "view_sample")).length).toBeGreaterThanOrEqual(1);
    expect((await eventsNamed(page, "preview_opened")).length).toBeGreaterThanOrEqual(1);

    await page.goto("/compass", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "ask_open",
        ),
      { timeout: 5000 },
    );
    expect((await eventsNamed(page, "ask_open")).length).toBeGreaterThanOrEqual(1);
  });

  test("consent gating: no events are recorded without analytics consent", async ({
    page,
  }) => {
    await withAnalytics(page, false); // analytics: false
    await page.goto("/guide/compatibility", { waitUntil: "domcontentloaded" });
    // תן זמן לאפקטים לרוץ; לא אמור להיווסף דבר.
    await page.waitForTimeout(1200);
    const all = await dataLayer(page);
    expect(all.filter((e) => e.event === "guide_viewed")).toHaveLength(0);
    expect(all).toHaveLength(0);
  });
});
