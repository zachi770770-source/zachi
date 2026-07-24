import { test, expect } from "@playwright/test";

test.describe("Pre-launch: המכירה סגורה, טעימה היא הפעולה הראשית", () => {
  test("Hero מוביל לטעימה, אין רכישה פעילה, /checkout חסום, API יוצר-הזמנה מחזיר 403", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "בונים אותה"
    );

    // הפעולה הראשית ב-Hero: קריאת טעימה (פעילה). אין כפתור רכישה disabled.
    await expect(
      page.getByRole("link", { name: "לקריאת טעימה מהספר" }).first()
    ).toBeVisible();
    await expect(page.getByText("המכירה נפתחת בקרוב").first()).toBeVisible();

    // /checkout מציג "המכירה עדיין לא נפתחה", ללא טופס הזמנה/תשלום.
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
