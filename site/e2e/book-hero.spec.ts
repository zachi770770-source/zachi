import { test, expect } from "./fixtures";

/**
 * פתיח /book חייב להראות מיד — מעל הקיפול — את הכריכה, הכותרת, שורת המיצוב
 * ולפחות ה-CTA הראשי לטעימה. נמדד תחת reduced-motion (מיקום סופי יציב, ללא
 * היסט אנימציה), במסכי דסקטופ 1440×900 ו-1365×936.
 */

const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1365, h: 936 },
];

for (const { w, h } of VIEWPORTS) {
  test(`/book first viewport at ${w}x${h}: cover + heading + positioning + primary CTA above the fold`, async ({
    browser,
  }) => {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await page.goto("/book", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 1500 }).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0));

    const items: Record<string, ReturnType<typeof page.locator>> = {
      cover: page.locator(".book-hero-enter"),
      heading: page.getByRole("heading", { level: 1 }),
      positioning: page.getByText("לא ספר שקוראים פעם אחת"),
      cta: page.locator('a[href="/preview"]').filter({ hasText: "קראו טעימה מהספר" }).first(),
    };

    for (const [name, loc] of Object.entries(items)) {
      await expect(loc, `${name} is visible`).toBeVisible();
      const box = await loc.boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.y, `${name} top is within the viewport`).toBeGreaterThanOrEqual(0);
      expect(
        box!.y + box!.height,
        `${name} bottom is above the fold at ${w}x${h}`,
      ).toBeLessThanOrEqual(h);
    }
    await ctx.close();
  });
}
