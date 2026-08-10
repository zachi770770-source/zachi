import { test, expect } from "./fixtures";

/**
 * עמוד ההצצה (/preview) — נפתח מיד ללא אימייל, חוויית קריאה ספרותית עם „דפדוף”
 * בין החלקים, מעבר למצפן, CTA דביק במובייל שאינו מכסה טופס/פוטר, ורשימת המתנה
 * עם מצבי הצלחה/כשל. אין רכישה/מחיר/checkout.
 */

test("/preview opens immediately (no email gate) with the reading experience", async ({ page }) => {
  const res = await page.goto("/preview", { waitUntil: "networkidle" });
  expect(res?.status()).toBe(200);
  // הקטע נקרא מיד — אין קיר הרשמה.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "התקדמות הקריאה" })).toHaveCount(1);
  // עוגן מעבר הכריכה מה-Hero קיים ביעד.
  await expect(page.locator("[data-vt-book-dest]")).toHaveCount(1);
  // גוף הקריאה גלוי בפועל (סטטי, בלי מנגנון-חשיפה שיכול להשאיר opacity:0).
  const lead = page.locator(".living-ink .reader-lead");
  await expect(lead).toBeVisible();
  await expect(lead).toHaveCSS("opacity", "1");
});

test("/preview has a clear transition to the compass and buys via Amazon (no local checkout)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  await expect(page.locator('a[href="/compass"]').first()).toBeVisible();
  // הרכישה עוברת לאמזון (חיצוני) — לא checkout מקומי.
  await expect(page.locator('a[href*="amazon.com/dp/B0GJ3SL9H2"]').first()).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test("/preview mobile: sticky waitlist CTA appears after scroll, hides at the form", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview", { waitUntil: "networkidle" });

  const sticky = page.locator('.md\\:hidden a[href="#join"]');
  // בראש העמוד — מוסתר (מחליק מטה).
  await expect(sticky).not.toBeInViewport();

  // גלילה חושפת גם את ה-CTA וגם את באנר העוגיות. ה-CTA מוסתר בכוונה כל עוד
  // הבאנר פתוח (כדי לא לכסותו); אחרי אישור העוגיות — הוא מופיע. גוללים אל תוך
  // אזור הקריאה (מעבר לסף החשיפה ≈0.7 מסך) אך לפני טופס-הסיום (#join),
  // שבעמוד הקריאה האחיד יושב גבוה יותר מבעבר.
  await page.mouse.wheel(0, 900);
  await page.getByRole("button", { name: "אישור הכל" }).click().catch(() => {});
  await expect(sticky).toBeInViewport();

  // בטופס הסיום — נעלם כדי לא לכסות את הטופס/הפוטר.
  await page.locator("#join").scrollIntoViewIfNeeded();
  await expect(sticky).not.toBeInViewport();
});

test("/preview closing: Amazon is the primary action, with a quiet future-edition waitlist link (no blocking form)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  const join = page.locator("#join");
  await join.scrollIntoViewIfNeeded();

  // פעולה ראשית: רכישה באמזון (חיצוני) — הקורא שסיים את הטעימה מוכן לקנות.
  await expect(
    join.getByRole("link", { name: /לרכישת הספר באמזון/ }),
  ).toHaveAttribute("href", /amazon\.com\/dp\/B0GJ3SL9H2/);

  // אין טופס הרשמה חוסם בתוך אזור הסיום — רק קישור שקט למהדורה הישירה העתידית.
  await expect(join.getByLabel("כתובת אימייל")).toHaveCount(0);
  await expect(
    join.getByRole("link", { name: /המהדורה הישירה באתר/ }),
  ).toHaveAttribute("href", "/waitlist");
});
