import { test, expect } from "./fixtures";

/**
 * היררכיית ה-CTA בהדר — ובעיקר: **אין תיקון-מראה אחרי הידרציה.**
 *
 * הכלל: פעולה ראשית אחת בכל מסך, וזה חל גם על ההדר. בעמוד הבית הפעולה הנכונה
 * מעל הקיפול היא הטעימה (סיכון אפס), ולכן כפתור-הרכישה שקט שם; בכל עמוד אחר
 * המבקר כבר בשקילת-מוצר והוא בולט.
 *
 * הסכנה שהבדיקה הזו קיימת בשבילה: לממש את זה ב-JS אחרי הידרציה. אז הצביעה
 * הראשונה מציגה שני כפתורים מלאים, וכעבור כמה עשרות מ״ש אחד מהם „מתקן” את
 * עצמו לשקט — הבהוב שהמבקר רואה. לכן ההכרעה נעשית בשרת (`data-cta`), וכאן
 * נדגם המראה שוב ושוב לאורך ההידרציה: מותר **מצב אחד בלבד**.
 */

const WIDTHS = [1440, 1024, 390] as const;

/**
 * שני כפתורי-רכישה קיימים תמיד ב-DOM (דסקטופ ומובייל), ורק אחד מהם גלוי לפי
 * ה-breakpoint. `.first()` היה תופס את הדסקטופי גם ב-390 ונכשל על „hidden”.
 * `Button asChild` ממזג את ה-props אל ה-<a> עצמו, ולכן `.header-buy` *הוא*
 * הקישור — אין <a> מקונן בתוכו.
 */
const visibleBuy = (page: import("@playwright/test").Page) =>
  page.locator(".header-buy").filter({ visible: true }).first();

/** דוגם את רקע כפתור-הרכישה שוב ושוב, ומחזיר את קבוצת המצבים שנצפו. */
async function observedStates(page: import("@playwright/test").Page) {
  const seen = new Set<string>();
  for (let i = 0; i < 20; i++) {
    const state = await page.evaluate(() => {
      const els = [...document.querySelectorAll(".header-buy")].filter(
        (e) => (e as HTMLElement).offsetParent !== null,
      );
      const el = els[0];
      if (!el) return "missing";
      return `${el.getAttribute("data-cta")}|${getComputedStyle(el).backgroundColor}`;
    });
    seen.add(state);
    await page.waitForTimeout(50);
  }
  return [...seen];
}

for (const width of WIDTHS) {
  test(`@${width} home: the header purchase CTA is quiet from first paint, with no hydration flash`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // ה-HTML מהשרת כבר מכריז את הטון — לא נקבע אחרי טעינת ה-JS.
    await expect(visibleBuy(page)).toHaveAttribute("data-cta", "quiet");

    const states = await observedStates(page);
    expect(states, `header CTA must not change appearance during hydration @${width}`).toHaveLength(1);
    expect(states[0]).toContain("quiet");
    // שקט = ללא מילוי.
    expect(states[0]).toContain("rgba(0, 0, 0, 0)");

    // ועדיין נוכח ולחיץ — „שקט” אינו „מוסתר”.
    const buy = visibleBuy(page);
    await expect(buy).toBeVisible();
    const box = await buy.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);

    await ctx.close();
  });

  test(`@${width} product page: the header purchase CTA is prominent from first paint`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    const page = await ctx.newPage();
    await page.goto("/book", { waitUntil: "domcontentloaded" });

    await expect(visibleBuy(page)).toHaveAttribute("data-cta", "strong");
    const states = await observedStates(page);
    expect(states, `header CTA must not change appearance during hydration @${width}`).toHaveLength(1);
    expect(states[0]).toContain("strong");
    await ctx.close();
  });
}

test("home: after passing the Hero the purchase CTA becomes prominent, in the site's own button colour", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const buy = visibleBuy(page);
  const quiet = await buy.evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const hero = document.querySelector(".sig-hero");
    window.scrollTo(0, (hero?.getBoundingClientRect().height ?? 900) + 200);
  });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.hasAttribute("data-past-hero")))
    .toBe(true);

  const strong = await buy.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(strong).not.toBe(quiet);

  // אותו גוון בדיוק של כפתור-הרכישה בעמוד מוצר — לא ערכת-צבע שנייה להדר.
  await page.goto("/book", { waitUntil: "networkidle" });
  const onBook = await visibleBuy(page).evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(strong).toBe(onBook);
});

test("no-JS home: the purchase CTA stays visible and secondary", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const buy = visibleBuy(page);
  await expect(buy).toBeVisible();
  await expect(buy).toHaveAttribute("data-cta", "quiet");
  // ללא JS אין קידום, ולכן הוא נשאר שקט — אך לחיץ ומוביל לרכישה.
  await expect(buy).toHaveAttribute("href", /\/book#purchase|amazon/);
  await ctx.close();
});
