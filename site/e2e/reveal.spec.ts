import { test, expect } from "./fixtures";

/**
 * רגרסיה למערכת החשיפה (Reveal): תוכן/CTA לעולם אינו נשאר נסתר.
 * הבאג המקורי: אלמנטים עם class `.reveal` (גם גולמיים, ללא רכיב <Reveal>) הוסתרו
 * ע"י `.motion-js .reveal{opacity:0}` ואיש לא הוסיף `.is-visible`. הבקר הגלובלי
 * ב-MotionRoot חושף כל `.reveal` (מעל הקיפול/deep-link מיד, מתחת בגלילה, +fail-safe).
 */

const opacityOf = (loc: import("./fixtures").Locator) =>
  loc.evaluate((el) => parseFloat(getComputedStyle(el).opacity));

async function noHiddenReveal(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".reveal")].filter(
      (e) => parseFloat(getComputedStyle(e).opacity) < 0.99
    ).length
  );
}

test("/author: body copy is visible (not stuck at opacity 0)", async ({ page }) => {
  await page.goto("/author", { waitUntil: "networkidle" });
  // ה-motion-js אמור להיות פעיל (JS + IO + לא reduced), והתוכן חשוף.
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("motion-js")))
    .toBe(true);
  const body = page.locator(".reveal").first();
  await expect.poll(() => opacityOf(body)).toBeGreaterThan(0.99);
  await expect(page.getByText(/זיהיתי קושי משותף/)).toBeVisible();
  await expect.poll(() => noHiddenReveal(page)).toBe(0);
});

test("/book: every reveal section is visible after scrolling through", async ({ page }) => {
  await page.goto("/book", { waitUntil: "networkidle" });
  for (let y = 0; y <= 8000; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(120);
  }
  await expect.poll(() => noHiddenReveal(page)).toBe(0);
});

test("/book: deep-link leaves no section at/above the fold hidden", async ({ page }) => {
  await page.goto("/book#method", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const stuckAtOrAbove = await page.evaluate(() => {
    const bottom = window.scrollY + window.innerHeight;
    return [...document.querySelectorAll(".reveal")].filter((e) => {
      const top = e.getBoundingClientRect().top + window.scrollY;
      return top < bottom && parseFloat(getComputedStyle(e).opacity) < 0.99;
    }).length;
  });
  expect(stuckAtOrAbove).toBe(0);
});

test("station deep page: raw .reveal sections are all visible", async ({ page }) => {
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  for (let y = 0; y <= 6000; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(100);
  }
  await expect.poll(() => noHiddenReveal(page)).toBe(0);
});

test("reduced-motion: /author and /book show full content immediately, no motion-js", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const path of ["/author", "/book"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("motion-js")))
      .toBe(false);
    await expect.poll(() => noHiddenReveal(page)).toBe(0);
  }
  await ctx.close();
});

test("no broken images on home, /author and /book", async ({ page }) => {
  for (const path of ["/", "/author", "/book"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src)
    );
    expect(broken, `broken images on ${path}`).toEqual([]);
  }
});

test("no horizontal overflow at 375 on home, /author, /book, /preview", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 720 } });
  const page = await ctx.newPage();
  for (const path of ["/", "/author", "/book", "/preview"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow, `horizontal overflow on ${path} @375`).toBe(false);
  }
  await ctx.close();
});

test("/author primary CTA is visible and links to the free sample (no checkout)", async ({
  page,
}) => {
  await page.goto("/author", { waitUntil: "networkidle" });
  const cta = page.getByRole("link", { name: "לקריאת טעימה מהספר" });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", "/preview");
});
