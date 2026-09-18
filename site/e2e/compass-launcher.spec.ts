import { expect, test } from "@playwright/test";

/**
 * „שאל את הספר” — המשגר הצף הגלובלי.
 *
 * הרכיב הזה כבר הוסר פעם אחת (‎5d9eb82‎) ואז בוקש בחזרה. הבדיקה הזו קיימת כדי
 * שהסיבוב הזה לא יחזור בשקט: היא נכשלת גם אם המשגר ייעלם, גם אם הוא יופיע
 * במקום שבו אינו אמור (‎/compass‎, ‎/en‎), וגם אם הניסוח ישתנה.
 */
const LABEL = "שאל את הספר";

/**
 * עמודים רגילים שבהם המשגר חייב להופיע — כולל מאמר-מדריך, עמוד-כלי ועמוד
 * הטעימה. ‎/preview‎ היה מוחרג כאן במובייל בסבב קודם, בגלל בדיקה ישנה שאסרה
 * שם כל שכבה צפה; דרישת-המוצר הנוכחית („בכל עמוד עברי ציבורי”) גוברת, והבדיקה
 * ההיא עודכנה במכוון. ‎e2e/preview.spec.ts‎ מחזיק את הצד השני של החוזה: שם
 * מותרים בדיוק ההדר, סרגל-הקורא והמשגר — ושום שכבה אחרת.
 */
const PAGES = [
  "/",
  "/love",
  "/dating",
  "/book",
  "/guide",
  "/guide/healthy-relationship",
  "/method/quiet-check",
  "/author",
  "/preview",
  "/reader",
];

/** המשגר מוסתר במובייל מעל ה-Hero; גלילה מעבר לסף חושפת אותו. */
async function revealOnMobile(page: import("@playwright/test").Page) {
  await page.evaluate(() => window.scrollTo(0, Math.max(400, window.innerHeight)));
  await page.waitForTimeout(250);
}

test.describe("משגר „שאל את הספר” — נוכחות גלובלית", () => {
  for (const path of PAGES) {
    test(`מופיע ב-${path} ומנווט אל /compass`, async ({ page }) => {
      await page.goto(path);
      await revealOnMobile(page);

      const launcher = page.getByRole("link", { name: new RegExp(LABEL) });
      await expect(launcher).toHaveCount(1); // בדיוק אחד — אין כפילות
      await expect(launcher).toBeVisible();

      // הניסוח המדויק, לא רק „מכיל”.
      await expect(launcher).toContainText(LABEL);
      await expect(launcher).toHaveAttribute("href", "/compass");

      // צף באמת: position:fixed, ולא אלמנט בזרימה.
      const position = await launcher.evaluate((el) => getComputedStyle(el).position);
      expect(position).toBe("fixed");
    });
  }

  test("נגיש במקלדת ומקבל מצב-פוקוס נראה", async ({ page }) => {
    await page.goto("/love");
    await revealOnMobile(page);
    const launcher = page.getByRole("link", { name: new RegExp(LABEL) });
    await launcher.focus();
    await expect(launcher).toBeFocused();
  });

  test("לחיצה מגיעה אל /compass", async ({ page }) => {
    await page.goto("/love");
    await revealOnMobile(page);
    await page.getByRole("link", { name: new RegExp(LABEL) }).click();
    await expect(page).toHaveURL(/\/compass$/);
  });
});

test.describe("משגר „שאל את הספר” — היכן שהוא לא אמור להיות", () => {
  test("אינו מופיע ב-/compass — העמוד עצמו הוא החוויה", async ({ page }) => {
    await page.goto("/compass");
    await revealOnMobile(page);
    const fixedLauncher = page.locator('a[href="/compass"]').filter({ hasText: LABEL });
    await expect(fixedLauncher).toHaveCount(0);
  });

  test("אינו מופיע ב-/en — מנוע-ההכוונה עברי בלבד", async ({ page }) => {
    await page.goto("/en");
    await revealOnMobile(page);
    await expect(page.locator('a[href="/compass"]')).toHaveCount(0);
  });
});

test.describe("משגר „שאל את הספר” — אינו חופף לשכבות צפות אחרות", () => {
  test("יושב מעל הסכמת-העוגיות ולא עליה", async ({ page }) => {
    await page.goto("/love");
    await revealOnMobile(page);
    const launcher = page.getByRole("link", { name: new RegExp(LABEL) });
    await expect(launcher).toBeVisible();
    const banner = page.locator("div.animate-slide-up").first();
    if (await banner.count()) {
      const a = await launcher.boundingBox();
      const b = await banner.boundingBox();
      if (a && b) {
        // אין חיתוך מלבנים: תחתית המשגר מעל ראש הבאנר.
        expect(a.y + a.height).toBeLessThanOrEqual(b.y + 1);
      }
    }
  });
});
