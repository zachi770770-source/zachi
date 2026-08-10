import { test, expect } from "./fixtures";

test.describe("Pre-launch: המכירה סגורה", () => {
  test("אין כפתור רכישה פעיל, /checkout חסום, ו-API יוצר-הזמנה מחזיר 403", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "אהבה בונים"
    );

    // אמזון הוא ערוץ הרכישה היחיד: סגירת הבית מפנה לרכישה באמזון (אין רשימת
    // המתנה ואין טופס אימייל), ואין כפתור/קישור checkout מקומי פעיל.
    await expect(
      page.locator("#get-the-book").getByRole("link", { name: "לרכישה באמזון" })
    ).toBeVisible();
    await expect(page.getByLabel("כתובת אימייל")).toHaveCount(0);
    await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);

    // /checkout מציג עמוד "הרכישה הישירה באתר עדיין לא נפתחה", ללא טופס.
    await page.goto("/checkout?format=digital", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: "הרכישה הישירה באתר עדיין לא נפתחה" })
    ).toBeVisible();
    await expect(page.getByLabel("שם מלא")).toHaveCount(0);

    // חסימת צד-שרת: אי אפשר ליצור הזמנה.
    const res = await request.post("/api/checkout", {
      data: {
        format: "digital",
        fullName: "בדיקה",
        email: "test@example.com",
        quantity: 1,
        agreeToTerms: true,
        marketingConsent: false,
        idempotencyKey: "abcdefghij123456",
      },
    });
    expect(res.status()).toBe(403);
  });
});
