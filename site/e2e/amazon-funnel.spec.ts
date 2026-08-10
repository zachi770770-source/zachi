import type { Locator } from "@playwright/test";

import { test, expect } from "./fixtures";

/**
 * הספר זמין לרכישה עכשיו ב-Amazon Kindle. משפך ההמרה מוביל לרכישה חיצונית
 * באמזון (לא checkout מקומי), בכל נקודות ההחלטה, ובלי „dead-end” של המתנה.
 */

const ASIN = "B0GJ3SL9H2";
const AMAZON_RE = new RegExp(`amazon\\.com/dp/${ASIN}`);

/** קישור רכישה יחיד ותקין באמזון בתוך scope נתון. */
async function expectAmazonBuy(scope: Locator) {
  const link = scope.locator(`a[href*="amazon.com/dp/${ASIN}"]`).first();
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(link).toHaveAttribute("href", AMAZON_RE);
}

test("Flow A — Home offers a real external Amazon purchase (secondary to the sample)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // הפעולה הראשית נשארת הטעימה.
  await expect(
    page.locator("main section").first().getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" }),
  ).toBeVisible();
  // וקיימת רכישה חיצונית באמזון.
  await expectAmazonBuy(page.locator("main"));
});

test("Flow B — /preview closing routes the warm reader to Amazon", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  await expectAmazonBuy(page.locator("#join"));
});

test("Flow B2 — /book leads to Amazon, with sample as the quiet secondary", async ({ page }) => {
  await page.goto("/book", { waitUntil: "networkidle" });
  await expectAmazonBuy(page.locator("#purchase"));
  await expect(
    page.locator("#purchase").getByRole("link", { name: /קראו טעימה מהספר/ }),
  ).toBeVisible();
});

for (const path of [
  "/before-relationship",
  "/building-relationship",
  "/inside-relationship",
  "/after-breakup",
]) {
  test(`Flow C — ${path} ends with one Amazon purchase exit`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await expectAmazonBuy(page.locator("main"));
    // פעם אחת בלבד — לא כפתור אמזון בכל שני מסכים.
    await expect(page.locator(`main a[href*="amazon.com/dp/${ASIN}"]`)).toHaveCount(1);
  });
}

test("no pre-launch dead-end: key pages never claim the book isn't out yet", async ({ page }) => {
  for (const path of ["/", "/preview", "/book", "/before-relationship", "/after-breakup"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const body = page.locator("body");
    for (const phrase of ["כשהספר יוצא", "המכירה תיפתח בקרוב", "טרום-השקה", "תושק ב-98"]) {
      await expect(body, `"${phrase}" on ${path}`).not.toContainText(phrase);
    }
  }
});
