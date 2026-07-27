import { test, expect } from "@playwright/test";

/**
 * כיסוי משלים למצב הקריאה ב-/preview (SampleReader). בדיקות ה-launch-ready
 * מכסות טקסט נגיש, הגדלת כתב, מצב כהה + התמדה, מד התקדמות וחזרה. כאן:
 * גבולות מינ'/מקס' לגופן, אזור-מגע 44px, אחסון חסום, ומניעת overflow.
 */

test("reader: font size stays within the min and max bounds", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  const reader = page.locator(".sample-reader");
  const dec = page.getByRole("button", { name: "הקטנת גודל הכתב" });
  const inc = page.getByRole("button", { name: "הגדלת גודל הכתב" });
  const scale = () =>
    reader.evaluate((el) => Number(getComputedStyle(el).getPropertyValue("--reader-fs")));

  // עד הרצפה — הכפתור נחסם ואינו יורד מתחת ל-0.9.
  for (let i = 0; i < 12 && (await dec.isEnabled()); i++) await dec.click();
  expect(await scale()).toBeGreaterThanOrEqual(0.9);
  await expect(dec).toBeDisabled();

  // עד התקרה — הכפתור נחסם ואינו עולה מעל 1.5.
  for (let i = 0; i < 14 && (await inc.isEnabled()); i++) await inc.click();
  expect(await scale()).toBeLessThanOrEqual(1.5);
  await expect(inc).toBeDisabled();
});

test("reader: controls meet the 44px touch target on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview", { waitUntil: "networkidle" });
  for (const name of ["הקטנת גודל הכתב", "הגדלת גודל הכתב"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box!.height, name).toBeGreaterThanOrEqual(44);
    expect(box!.width, name).toBeGreaterThanOrEqual(44);
  }
  const theme = await page.getByRole("button", { name: /מצב קריאה/ }).boundingBox();
  expect(theme!.height).toBeGreaterThanOrEqual(44);
});

test("reader: works when localStorage is blocked (no crash, theme still toggles)", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    const t = () => {
      throw new Error("storage blocked");
    };
    Object.defineProperty(window.localStorage, "getItem", { value: t });
    Object.defineProperty(window.localStorage, "setItem", { value: t });
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/preview", { waitUntil: "networkidle" });
  const reader = page.locator(".sample-reader");
  await expect(reader).toBeVisible();
  await page.getByRole("button", { name: "מצב קריאה כהה" }).click();
  await expect(reader).toHaveAttribute("data-reader-theme", "dark");
  expect(errors, errors.join("\n")).toEqual([]);
  await ctx.close();
});

test("reader: no horizontal overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview", { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  expect(overflow).toBe(false);
});
