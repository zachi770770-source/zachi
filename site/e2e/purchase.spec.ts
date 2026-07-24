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

    // ה-CTA אינו מטעה: כפתור "המכירה תיפתח בקרוב" (מושבת), לא קישור לתשלום.
    await expect(
      page.getByRole("button", { name: "המכירה תיפתח בקרוב" }).first()
    ).toBeVisible();

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
