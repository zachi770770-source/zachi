import { test, expect, type Page, type Locator } from "./fixtures";

/**
 * „נראה בפועל”, לא רק „קיים ב-DOM”: הבדיקות כאן מוודאות שתוכן מרכזי מרונדר עם
 * bounding-box חיובי, opacity/visibility גלויים, בתוך תחום המסך, ועם טקסט ממשי.
 * נועד לתפוס רגרסיות כמו „עמוד הטעימה מציג רק מעטפת + שטח לבן” (תוכן שנתקע
 * ב-opacity:0 כשאנימציית-חשיפה לא נורית).
 *
 * דגש מיוחד על /preview: התוכן חייב להיראות ב-100%–200% zoom, אחרי הגדלת-טקסט,
 * ב-reduced-motion, בכניסה ישירה + רענון, במצב כהה, וכשבאנר-העוגיות פתוח.
 */

/** אלמנט „נראה בפועל”: bbox חיובי, גלוי, opacity≳1, ויש בו טקסט. */
async function expectReallyVisible(
  loc: Locator,
  { minText = 8 }: { minText?: number } = {},
) {
  await expect(loc).toBeVisible();
  const box = await loc.boundingBox();
  expect(box, "bounding box exists").not.toBeNull();
  expect(box!.width, "width > 0").toBeGreaterThan(0);
  expect(box!.height, "height > 0").toBeGreaterThan(0);
  const op = await loc.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(op, "opacity ~ 1").toBeGreaterThan(0.9);
  const txt = (await loc.textContent())?.trim() ?? "";
  expect(txt.length, "has real text").toBeGreaterThanOrEqual(minText);
}

/** האלמנט נמצא מעל הקפל (y בתוך גובה המסך, ולא מעל הצג). boundingBox מחזיר y. */
async function expectAboveFold(loc: Locator, page: Page) {
  const box = await loc.boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box!.y, "top within viewport").toBeLessThan(vh);
  expect(box!.y, "top not above screen").toBeGreaterThanOrEqual(-2);
}

const READER_BODY = ".living-ink .reader-lead";

test.describe("/preview — התוכן המרכזי גלוי בפועל בכל מצב", () => {
  test("1280×768: יש טקסט קריאה ממשי מעל הקפל (לא רק המעטפת)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto("/preview", { waitUntil: "networkidle" });
    const lead = page.locator(READER_BODY);
    await expectReallyVisible(lead, { minText: 20 });
    await expectAboveFold(lead, page);
  });

  for (const w of [320, 360, 390, 768, 1024, 1280, 1440]) {
    test(`רוחב ${w}: גוף הטעימה גלוי (bbox חיובי, opacity~1, טקסט)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto("/preview", { waitUntil: "networkidle" });
      await expectReallyVisible(page.locator(READER_BODY), { minText: 20 });
      // גם משפט-המפתח והסוגר גלויים (היו .reader-leaf שנתקעו ב-opacity:0).
      await expectReallyVisible(page.locator(".reader-principle__text"));
      await expectReallyVisible(page.locator(".reader-closing__prompt"));
    });
  }

  for (const zoom of [1, 2]) {
    test(`zoom ${zoom * 100}%: גוף הטעימה נשאר גלוי`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 768 });
      await page.goto("/preview", { waitUntil: "networkidle" });
      await page.evaluate((z) => {
        (document.documentElement.style as unknown as { zoom: string }).zoom = String(z);
      }, zoom);
      await page.waitForTimeout(150);
      await expectReallyVisible(page.locator(READER_BODY), { minText: 20 });
    });
  }

  test("אחרי הגדלת-טקסט (×2) התוכן נשאר גלוי", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto("/preview", { waitUntil: "networkidle" });
    const plus = page.getByRole("button", { name: /הגדל/ });
    await plus.click();
    await plus.click();
    await expectReallyVisible(page.locator(READER_BODY), { minText: 20 });
  });

  test("reduced-motion + כניסה ישירה: כל התוכן מיד גלוי", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto("/preview", { waitUntil: "networkidle" });
    for (const sel of [
      READER_BODY,
      ".reader-principle__text",
      ".reader-closing__prompt",
      ".reader-cta a",
    ]) {
      await expectReallyVisible(page.locator(sel), { minText: 3 });
    }
  });

  test("רענון קשיח (reload) — התוכן עדיין גלוי", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto("/preview", { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await expectReallyVisible(page.locator(READER_BODY), { minText: 20 });
  });

  test("מצב קריאה כהה — התוכן גלוי", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto("/preview", { waitUntil: "networkidle" });
    // כפתור מצב-הקריאה הכהה/בהיר הוא היחיד עם aria-pressed בסרגל הקורא.
    await page.locator(".reader-tools button[aria-pressed]").click();
    await expect(page.locator(".sample-reader[data-reader-theme='dark']")).toBeVisible();
    await expectReallyVisible(page.locator(READER_BODY), { minText: 20 });
  });

  test("באנר-עוגיות פתוח — התוכן מאחוריו גלוי", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto("/preview", { waitUntil: "networkidle" });
    // לא סוגרים את הבאנר.
    await expectReallyVisible(page.locator(READER_BODY), { minText: 20 });
  });

  test("no-JS: גוף הטעימה מרונדר וגלוי גם בלי JavaScript", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 768 });
    await page.goto("/preview", { waitUntil: "domcontentloaded" });
    await expectReallyVisible(page.locator(READER_BODY), { minText: 20 });
    await ctx.close();
  });
});

test.describe("עמודים מרכזיים — כותרת + תוכן גוף גלויים בפועל", () => {
  const pages: { path: string; body: string }[] = [
    { path: "/", body: "#who h2" },
    { path: "/book", body: "#tools" },
    { path: "/before-relationship", body: "#difficulty-heading" },
    { path: "/building-relationship", body: "#difficulty-heading" },
    { path: "/inside-relationship", body: "#difficulty-heading" },
    { path: "/after-breakup", body: "#difficulty-heading" },
    { path: "/starting-again", body: "#difficulty-heading" },
    { path: "/compass", body: '[role="radiogroup"]' },
    { path: "/faq", body: "main" },
    { path: "/contact", body: "form" },
  ];
  for (const { path, body } of pages) {
    for (const w of [390, 1280]) {
      test(`${path} @ ${w}: H1 + תוכן גוף גלויים`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(path, { waitUntil: "networkidle" });
        await expectReallyVisible(page.getByRole("heading", { level: 1 }).first(), {
          minText: 3,
        });
        await expectReallyVisible(page.locator(body).first(), { minText: 2 });
      });
    }
  }
});
