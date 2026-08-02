import { test, expect, type Page, type Locator } from "./fixtures";

/**
 * ניווט עליון (PHASE 15 correction) — פריטי התפריט הגלויים חייבים לנווט בין
 * עמודים אמיתיים בלבד: אין עוגני # / /# באף פריט, כל יעד הוא עמוד קיים,
 * והתפריט בדסקטופ ובמגירת המובייל מצביע לאותם יעדים בדיוק. קישור הדילוג
 * #main-content מוחרג (אינו חלק מהתפריט).
 */

async function readNavMap(scope: Page | Locator) {
  // הקישורים בתוך <nav aria-label="ניווט ראשי"> (זהה בדסקטופ ובמגירה).
  const links = scope.locator("nav[aria-label='ניווט ראשי'] a[href]");
  const count = await links.count();
  const map: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    const el = links.nth(i);
    const label = (await el.innerText()).replace(/\s+/g, " ").trim();
    const href = (await el.getAttribute("href")) ?? "";
    map[label] = href;
  }
  return map;
}

test("desktop top nav: every item is a real page and none uses a hash fragment", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const map = await readNavMap(page);
  expect(Object.keys(map).length).toBeGreaterThanOrEqual(4);

  const hrefs = Object.values(map);
  for (const [label, href] of Object.entries(map)) {
    // (2) אין fragment באף יעד גלוי בתפריט.
    expect(href, `menu item "${label}" must not contain '#'`).not.toContain("#");
    // (1) כל יעד הוא עמוד קיים (טעינה ישירה מחזירה < 400).
    const resp = await page.request.get(href, { maxRedirects: 0 });
    expect(resp.status(), `menu item "${label}" → ${href}`).toBeLessThan(400);
  }

  // (3) כל היעדים ייחודיים — אין שני פריטים לאותו עמוד.
  expect(new Set(hrefs).size, `duplicate destinations: ${hrefs.join(", ")}`).toBe(
    hrefs.length
  );

  // מיפוי היעדים הנדרש (לפי התוויות הקיימות).
  expect(map["על המחבר"]).toBe("/author");
  expect(map["הספר"]).toBe("/book");
  expect(map["שאלו את הספר"]).toBe("/compass");
  expect(map["טעימה"]).toBe("/preview");
  expect(map["שאלות נפוצות"]).toBe("/faq");
});

test("mobile drawer uses the exact same routes as the desktop nav (no fragments)", async ({
  browser,
}) => {
  // מפת הדסקטופ.
  const deskCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const deskPage = await deskCtx.newPage();
  await deskPage.goto("/", { waitUntil: "domcontentloaded" });
  const desktopMap = await readNavMap(deskPage);
  await deskCtx.close();

  // מפת המגירה במובייל.
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("header button").last().click();
  const dialog = page.locator("[role='dialog']");
  await dialog.waitFor({ state: "visible" });
  const mobileMap = await readNavMap(dialog);

  // (3) אותם יעדים בדיוק בדסקטופ ובמובייל.
  expect(mobileMap).toEqual(desktopMap);
  // (2) שוב — אין fragment באף יעד במגירה.
  for (const href of Object.values(mobileMap)) {
    expect(href).not.toContain("#");
  }
  await ctx.close();
});

test("clicking a top-nav item navigates to the page, and back/forward works", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const nav = page.locator("nav[aria-label='ניווט ראשי']");

  await nav.getByRole("link", { name: "טעימה" }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.locator("h1")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);

  await page.goForward();
  await expect(page).toHaveURL(/\/preview$/);

  // ניווט נוסף: „שאלות נפוצות” → /faq (עמוד אמיתי).
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page
    .locator("nav[aria-label='ניווט ראשי']")
    .getByRole("link", { name: "שאלות נפוצות" })
    .click();
  await expect(page).toHaveURL(/\/faq$/);
});
