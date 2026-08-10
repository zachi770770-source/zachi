import { test, expect } from "./fixtures";

/**
 * רגרסיית קופי — מונח „טעימה” אחיד בכל האתר. הביטויים הישנים אסורים בכל מקום,
 * כולל טקסט מוסתר (בר-הטעימה הדביק) ותוכן מותאם-כלי. נבדק מול ה-HTML המלא
 * (page.content) כדי לתפוס גם אלמנטים שאינם גלויים כרגע.
 *
 * מותר רק: „טעימה מהספר · 2 דקות” / „לקריאת טעימה מהספר” / „קראו טעימה מהספר · 2 דקות”.
 */

const BANNED = [
  "קטע אמיתי מהספר",
  "טעימה חינם", // מכסה „טעימה חינם מהספר” ו„קראו עכשיו טעימה חינם מהספר”
];

const ROUTES = [
  "/",
  "/book",
  "/preview",
  "/preview?tool=quiet-check&station=before-relationship",
];

for (const route of ROUTES) {
  test(`no banned tasting-copy variant anywhere on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const html = await page.content();
    for (const banned of BANNED) {
      expect(html, `"${banned}" must not appear on ${route}`).not.toContain(banned);
    }
  });
}

test("home sticky tasting bar uses the unified term (visible after scroll)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  const bar = page.locator('a[href="/preview"]').filter({ hasText: "טעימה מהספר" }).first();
  // הבר קיים ונקי — ואין וריאנט אסור בשום מקום ב-DOM.
  const html = await page.content();
  expect(html).not.toContain("קטע אמיתי מהספר");
  expect(html).not.toContain("טעימה חינם");
  await expect(bar).toHaveCount(1);
});
