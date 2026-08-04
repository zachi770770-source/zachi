import { test, expect } from "./fixtures";

/**
 * שדרוג המעורבות בטרום-השקה: טעימה ללא-חיכוך + בר-טעימה חכם.
 * הכללים: אין רכישה; הטעימה נגישה ללא הרשמה; הבר מופיע רק אחרי ה-Hero,
 * מפנה ל-/preview, נסגר ונזכר ל-session.
 */

test("zero-friction: hero sample link opens /preview with no registration", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator("main section").first();
  const link = hero.getByRole("link", { name: "לקריאת טעימה ללא הרשמה" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/preview");
  // ניווט ישיר — בלי אימייל, בלי מודאל.
  await link.click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("/preview is directly loadable and immediately readable (no signup wall)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  // תוכן הקריאה גלוי מיד; אין חסימת-הרשמה.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overlayForm = page.getByRole("dialog");
  await expect(overlayForm).toHaveCount(0);
});

test("smart sticky sample bar: appears after hero, links to /preview, dismissal persists for session", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  const bar = page.getByRole("complementary", { name: "בר הטעימה" });

  // לא מופיע כל עוד ה-Hero בתצוגה.
  await expect(bar).toBeHidden();

  // אחרי גלילה מעבר ל-Hero — מופיע, מפנה לטעימה החינמית, ללא ניסוח רכישה.
  await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.5)));
  await expect(bar).toBeVisible();
  const cta = bar.getByRole("link", { name: /קראו טעימה חינם/ });
  await expect(cta).toHaveAttribute("href", "/preview");
  await expect(bar.getByText(/לרכישה|buy|קנ/i)).toHaveCount(0);

  // סגירה — נעלם ונזכר ל-session (גם אחרי reload).
  await bar.getByRole("button", { name: "סגירת בר הטעימה" }).click();
  await expect(bar).toBeHidden();
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, Math.round(document.body.scrollHeight * 0.5)));
  await expect(page.getByRole("complementary", { name: "בר הטעימה" })).toBeHidden();
  await ctx.close();
});

test("no fabricated social proof rendered in pre-launch (no stars, no reader counter)", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // אין דירוג כוכבים ואין מונה קוראים מזויף.
  await expect(page.getByText(/מעל \d+ קוראים|★|⭐/)).toHaveCount(0);
});
