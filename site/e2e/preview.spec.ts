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
  // „עלים” לדפדוף קיימים ולא מסתירים תוכן (הטקסט קיים ב-DOM).
  await expect(page.locator(".reader-leaf")).not.toHaveCount(0);
});

test("/preview has a clear transition to the compass and no purchase CTA", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  await expect(page.locator('a[href="/compass"]').first()).toBeVisible();
  // אין רכישה/מחיר/checkout בטרום-השקה.
  await expect(page.getByRole("link", { name: "לרכישת הספר" })).toHaveCount(0);
  await expect(page.locator('a[href*="checkout"]')).toHaveCount(0);
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

test("/preview waitlist: validation error, then a designed success state", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  const form = page.locator("#join");
  await form.scrollIntoViewIfNeeded();

  const email = form.getByLabel("כתובת אימייל");
  await email.fill(`preview_${Date.now()}@example.com`);

  // שליחה בלי הסכמה → שגיאת ולידציה (aria-live), בלי לשלוח.
  await form.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
  await expect(form.getByRole("alert")).toContainText("לאשר את קבלת העדכון");

  // אישור הסכמה ושליחה → מצב הצלחה מעוצב.
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
  await expect(page.getByText("נרשמת בהצלחה. הטעימה מחכה לכם.")).toBeVisible();
  await expect(page.getByRole("link", { name: /לקריאת הטעימה/ })).toBeVisible();
});
