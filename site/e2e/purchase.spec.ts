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

    // מצב טרום-השקה: הפעולה המרכזית היא ההרשמה (כפתור הטופס „עדכנו אותי…”) —
    // לא כפתור רכישה חסום ולא תשלום.
    await expect(
      page.getByRole("button", { name: "עדכנו אותי כשהמהדורה הישירה תיפתח" }).first()
    ).toBeVisible();
    // אין checkout מקומי כל עוד הרכישה הישירה סגורה — הרכישה עוברת לאמזון.
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
