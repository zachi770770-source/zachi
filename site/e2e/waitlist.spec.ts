import { test, expect } from "@playwright/test";

test.describe("רשימת המתנה", () => {
  test("checkout closed: ללא הסכמה מציג שגיאה; עם הסכמה נרשם בהצלחה", async ({
    page,
  }) => {
    await page.goto("/checkout?format=digital", { waitUntil: "networkidle" });

    // ללא סימון הסכמה — שגיאה, אין הרשמה.
    await page.getByLabel("כתובת אימייל").fill("nobody@example.com");
    await page.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText("יש לאשר את קבלת העדכון")).toBeVisible();

    // עם הסכמה — הצלחה.
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText("נרשמת בהצלחה")).toBeVisible();
  });

  test("סוף עמוד הטעימה: הרשמה לרשימת המתנה מצליחה, והטעימה פתוחה", async ({
    page,
  }) => {
    await page.goto("/preview", { waitUntil: "networkidle" });

    // הטעימה עצמה גלויה ללא הרשמה.
    await expect(
      page.getByRole("heading", { name: "רוצים לדעת כשהספר יוצא?" })
    ).toBeVisible();

    await page.getByLabel("כתובת אימייל").fill("reader@example.com");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText("נרשמת בהצלחה")).toBeVisible();
  });
});
