import { test, expect } from "./fixtures";

test.describe("V1: אמזון הוא ערוץ הרכישה היחיד", () => {
  test("הבית מפנה לרכישה באמזון, ללא טופס אימייל וללא checkout מקומי", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "אהבה בונים"
    );

    // סגירת הבית מפנה לרכישה באמזון (אין רשימת המתנה ואין טופס אימייל),
    // ואין כפתור/קישור checkout מקומי.
    await expect(
      page.locator("#get-the-book").getByRole("link", { name: "לרכישה באמזון" })
    ).toBeVisible();
    await expect(page.getByLabel("כתובת אימייל")).toHaveCount(0);
    await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);

    // מסלול ה-checkout המקומי הוסר לחלוטין: העמוד וה-API אינם קיימים.
    const checkoutPage = await page.goto("/checkout?format=digital", {
      waitUntil: "networkidle",
    });
    expect(checkoutPage?.status()).toBe(404);

    const apiRes = await request.post("/api/checkout", {
      data: { format: "digital", email: "test@example.com" },
    });
    expect(apiRes.status()).toBe(404);
  });
});
