import { test, expect, type Page } from "@playwright/test";

/**
 * Phase B — שיפורי המרה קטנים והפיכים (מתוך אודיט מסע-ההמרה). שני שינויים,
 * *ללא* נגיעה בשמות אירועי-האנליטיקה, ב-consent gating או בשיוך (Phase A):
 *
 *   5. הבועה הצפה „מה הספר אומר על המצב שלי?” מוסתרת בעמודי תחתית-המשפך
 *      (/book, /preview) שבהם היא מתחרה ב-CTA הקנייה — ונשארת בעמודי הגילוי.
 *      הכניסה לעוזר בעמודים אלה נשמרת דרך הקישור הפנימי (AskBookLink → /compass),
 *      כך שאיש אינו מנותק מהעוזר.
 *   6. היררכיית ה-CTA בשער דורגה מחדש (*עיצוב בלבד*, כל היעדים נשמרו): פעולה
 *      ראשית = טעימה (כפתור מלא), פעולה משנית = רכישה באמזון (כפתור-מתאר, מובחן
 *      מעל הכלי במקום קישור-טקסט זהה שמתחרה בו), פעולה שלישית ושקטה = הכלי
 *      „מה הספר אומר על המצב שלי?” → /compass (קישור-טקסט).
 */

const AMAZON_RE = /amazon\.com\/dp\/B0GJ3SL9H2/;

/** הבועה הצפה — מסוננת לפי המקף שב-aria-label (נבדלת מכפתורי-מקטע). */
const bubble = (page: Page) =>
  page.getByRole("button", { name: /מה הספר אומר על המצב שלי\? — / });

async function dismissCookies(page: Page) {
  const accept = page.getByRole("button", { name: "אישור הכל" });
  await accept.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  if (await accept.count()) {
    await accept.first().click().catch(() => {});
    await page
      .waitForFunction(() => !document.body.hasAttribute("data-cookie-banner"))
      .catch(() => {});
  }
}

test.describe("Phase B #5 — floating bubble suppressed at the bottom of the funnel", () => {
  test("bubble IS present on the home page (control)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);
    await expect(bubble(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
  });

  for (const path of ["/book", "/preview"]) {
    test(`bubble is NOT rendered on ${path}, but the assistant stays reachable in-page (AskBookLink → /compass)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      await dismissCookies(page);

      // הבועה הצפה מוסתרת כאן (לא מתחרה ברכישה).
      await expect(bubble(page)).toHaveCount(0);

      // אך העוזר עדיין נגיש מהעמוד — קישור פנימי ל-/compass (AskBookLink).
      const inPageAssistant = page
        .locator('main a[href^="/compass"]')
        .first();
      await expect(inPageAssistant).toBeVisible();
    });
  }
});

test.describe("Phase B #6 — home hero CTA hierarchy (styling only, all destinations kept)", () => {
  test("primary sample (filled) › secondary Amazon (outline button) › tertiary compass (text link)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);

    const hero = page.locator("main section").first();

    // 1. ראשית — טעימה, כפתור מלא, → /preview (ללא שינוי).
    const sample = hero.getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" });
    await expect(sample).toHaveAttribute("href", "/preview");

    // 2. משנית — רכישה באמזון: אותו יעד/פתיחה-חיצונית כמו קודם, אך כעת כפתור-
    //    מתאר (outline) — מדרגה ברורה מעל הכלי. (עיצוב בלבד; היעד לא השתנה.)
    const amazon = hero.getByRole("link", { name: /הספר זמין עכשיו באמזון/ });
    await expect(amazon).toHaveAttribute("href", AMAZON_RE);
    await expect(amazon).toHaveAttribute("target", "_blank");
    await expect(amazon).toHaveAttribute("rel", /noopener/);
    // חתימת כפתור-המתאר של מערכת-העיצוב (rounded-md + border-border-strong) —
    // מבדילה אותו מהקישור-טקסט שהיה קודם, וממקמת אותו מעל הכלי.
    await expect(amazon).toHaveClass(/rounded-md/);
    await expect(amazon).toHaveClass(/border-border-strong/);

    // 3. שלישית ושקטה — הכלי → /compass, נשאר קישור-טקסט (בלי חתימת-כפתור).
    const compass = hero.getByRole("link", { name: "מה הספר אומר על המצב שלי?" });
    await expect(compass).toHaveAttribute("href", "/compass");
    await expect(compass).not.toHaveClass(/rounded-md/);

    // סדר היררכי בפועל (מלמעלה למטה): טעימה › אמזון › כלי.
    const yOf = async (l: import("@playwright/test").Locator) =>
      (await l.boundingBox())!.y;
    const [ySample, yAmazon, yCompass] = await Promise.all([
      yOf(sample),
      yOf(amazon),
      yOf(compass),
    ]);
    expect(ySample).toBeLessThan(yAmazon);
    expect(yAmazon).toBeLessThan(yCompass);
  });
});
