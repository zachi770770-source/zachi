import { test, expect } from "@playwright/test";

/**
 * כיסוי ממוקד ל„איפה אתם נתקעים?” (StuckSelector). בדיקות משלימות לאלה
 * שב-launch-ready (URL, שחזור מקומי, מובייל, מקלדת, reduced-motion):
 * בחירת כל ארבע האפשרויות, אחסון חסום, מניעת overflow, ומניעת קפיצת פריסה.
 */

const OPTIONS = ["reject-fast", "certainty", "calm", "in-relationship"] as const;

function labelFor(page: import("@playwright/test").Page, id: string) {
  return page.locator("#stuck label", { has: page.locator(`input[value="${id}"]`) });
}

test("stuck: exactly four options, each reveals its own answer when chosen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.locator("#stuck label")).toHaveCount(4);

  for (const id of OPTIONS) {
    await labelFor(page, id).click();
    await expect(page.locator("#stuck input:checked")).toHaveValue(id);
    await expect(page.locator("#stuck article")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`[?&]stuck=${id}`));
  }
});

test("stuck: works when localStorage is blocked (private mode) — no crash, selection still works", async ({
  browser,
}) => {
  const context = await browser.newContext();
  // חוסמים getItem/setItem כדי לדמות מצב פרטי/חסום, בלי לשבור את זהות האובייקט.
  await context.addInitScript(() => {
    const thrower = () => {
      throw new Error("storage blocked");
    };
    Object.defineProperty(window.localStorage, "getItem", { value: thrower });
    Object.defineProperty(window.localStorage, "setItem", { value: thrower });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/", { waitUntil: "networkidle" });
  await labelFor(page, "calm").click();

  // הבחירה עובדת (התוצאה מופיעה וה-URL מתעדכן) גם ללא אחסון, וללא שגיאה.
  await expect(page.locator("#stuck article")).toBeVisible();
  await expect(page).toHaveURL(/[?&]stuck=calm/);
  expect(errors, errors.join("\n")).toEqual([]);
  await context.close();
});

test("stuck: no horizontal overflow after selecting, at 390 and 1440", async ({ page }) => {
  for (const w of [390, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto("/?stuck=in-relationship", { waitUntil: "networkidle" });
    await expect(page.locator("#stuck article")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow, `overflow at ${w}px`).toBe(false);
  }
});

test("stuck: choosing reveals the answer below without shifting the heading/options above it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  const heading = page.locator("#stuck-heading");
  // מיקום מוחלט במסמך (בלתי תלוי בגלילה שנגרמת ממיקוד הרדיו בעת הלחיצה).
  const docTop = () =>
    heading.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const before = await docTop();
  await labelFor(page, "calm").click();
  await expect(page.locator("#stuck article")).toBeVisible();
  const after = await docTop();

  // התוצאה נוספת מתחת לאפשרויות; הכותרת והאפשרויות שמעליה אינן קופצות.
  expect(Math.abs(after - before)).toBeLessThan(4);
});
