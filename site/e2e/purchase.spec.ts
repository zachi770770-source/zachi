import { test, expect } from "@playwright/test";

test.describe("Pre-launch: המכירה סגורה", () => {
  test("אין כפתור רכישה פעיל, /checkout חסום, ו-API יוצר-הזמנה מחזיר 403", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "בונים אותה"
    );

    // מצב טרום-השקה: הפעולה המרכזית היא ההרשמה („קבלו טעימה ועדכון…”) —
    // לא כפתור רכישה חסום ולא תשלום.
    await expect(
      page.getByRole("button", { name: "קבלו טעימה ועדכון כשהספר יוצא" }).first()
    ).toBeVisible();
    // אין קישור רכישה פעיל אל התשלום כל עוד המכירה סגורה.
    await expect(page.getByRole("link", { name: "לרכישת הספר" })).toHaveCount(0);

    // /checkout מציג עמוד "המכירה עדיין לא נפתחה", ללא טופס.
    await page.goto("/checkout?format=digital", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: "המכירה עדיין לא נפתחה" })
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
