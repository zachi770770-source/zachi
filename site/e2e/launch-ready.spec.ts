import { test, expect } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

test.describe("Launch-readiness", () => {
  test("waitlist: CTA scrolls to the form, which submits successfully", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // ה-CTA הראשי מוביל לרשימת ההמתנה.
    await page.getByRole("link", { name: "קבלו עדכון כשהספר יוצא" }).first().click();
    const waitlist = page.locator("#waitlist");
    await expect(waitlist).toBeVisible();

    // מילוי ושליחה → הודעת הצלחה (מאגר בזיכרון בבדיקות), בלי לפתוח מכירה.
    await waitlist.getByLabel("כתובת אימייל").fill("dana@example.com");
    await waitlist.getByRole("checkbox").click();
    await waitlist.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText(/נרשמת בהצלחה/)).toBeVisible();
  });

  test("accessibility statement page exists and is linked from the footer", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "הצהרת נגישות" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/accessibility$/);
    await expect(page.getByRole("heading", { level: 1, name: "הצהרת נגישות" })).toBeVisible();
    await expect(page.getByText(/התאמות שבוצעו/)).toBeVisible();
  });

  test("FAQ works and is crawlable without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/faq", { waitUntil: "domcontentloaded" });
    // סריקה: התשובות נמצאות ב-HTML גם כשהאקורדיון סגור.
    const html = await page.content();
    expect(html).toContain("שלוש תחנות בדרך לאהבה");
    expect(html).toContain("הספר אינו תחליף לטיפול");
    // נגישות ללא JS: <details> נטיבי נפתח בלחיצה גם בלי JavaScript.
    await page.getByText("למי הספר מתאים?", { exact: true }).click();
    await expect(page.getByText(/שלוש תחנות בדרך לאהבה/)).toBeVisible();
    await context.close();
  });

  test("RTL + no horizontal overflow on home and key pages (mobile)", async ({ browser }) => {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    for (const path of ["/", "/author", "/faq", "/accessibility", "/checkout"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });
});
