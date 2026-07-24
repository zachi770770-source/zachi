import { test, expect } from "@playwright/test";

test.describe("מסלול רכישה בסיסי", () => {
  test("כניסה לעמוד הבית, רכישה, checkout ותשלום מוצלח מגיעים לעמוד תודה", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "להתחיל לבנות"
    );

    await page.getByRole("link", { name: "לרכישת הספר" }).first().click();
    await expect(page.locator("#purchase")).toBeInViewport();

    await page.getByRole("radio", { name: /שני עותקים/ }).click();

    await page
      .locator("#purchase")
      .getByRole("button", { name: /לרכישה/ })
      .click();

    await expect(page).toHaveURL(/\/checkout\?quantity=2&format=digital/);

    // מהדורה דיגיטלית - נדרשים שם ואימייל בלבד, ללא פרטי משלוח.
    await page.getByLabel("שם מלא").fill("ישראל ישראלי");
    await page.getByLabel(/אימייל/).fill("test@example.com");
    await page.getByLabel(/קראתי ואני מסכים/).click();

    await page.getByRole("button", { name: "מעבר לתשלום" }).click();

    await expect(page).toHaveURL(/\/checkout\/pay\//);
    await expect(
      page.getByRole("heading", { name: "מסך תשלום לדוגמה (Demo)" })
    ).toBeVisible();

    await page.getByRole("button", { name: "סימולציה: תשלום הצליח" }).click();

    await expect(page).toHaveURL(/\/thank-you\?order=/);
    await expect(
      page.getByRole("heading", { name: "תודה! ההזמנה התקבלה בהצלחה" })
    ).toBeVisible();
  });
});
