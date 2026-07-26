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

  test("author page: real photo, personal header, waitlist CTA (pre-launch)", async ({ page }) => {
    await page.goto("/author", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("למה כתבתי");
    const img = page.getByAltText("צחי חן, מחבר הספר מדייטים לאהבה");
    await expect(img).toBeVisible();
    const currentSrc = await img.evaluate((el) => (el as HTMLImageElement).currentSrc);
    expect(currentSrc).toMatch(/zachi-chen-\d+\.(avif|webp|jpg)/);
    const cta = page.getByRole("link", { name: "קבלו עדכון כשהספר יוצא" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/#waitlist");
    await expect(page.getByRole("link", { name: "לקריאת טעימה מהספר" })).toBeVisible();
  });

  test("cookie banner reserves space and does not cover the footer", async ({ page }) => {
    await page.goto("/author", { waitUntil: "networkidle" });
    const banner = page.getByRole("region", { name: "הסכמה לשימוש בעוגיות" });
    await expect(banner).toBeVisible();
    // הגוף שומר מקום בתחתית בגובה הבאנר בפועל, כך שהבאנר לא מכסה תוכן/פוטר.
    const pad = await page.evaluate(
      () => parseFloat(getComputedStyle(document.body).paddingBottom) || 0
    );
    const h = (await banner.boundingBox())!.height;
    expect(pad).toBeGreaterThan(0);
    expect(Math.abs(pad - h)).toBeLessThanOrEqual(4);
  });

  test("hero: opening thoughts are decorative, the refrain remains, CTA stays active", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // שכבת המחשבות דקורטיבית בלבד — מסומנת aria-hidden ומחוץ לעץ הנגישות.
    const thoughts = page.locator(".hero-thoughts");
    await expect(thoughts).toHaveAttribute("aria-hidden", "true");
    for (const thought of [
      "אולי אין מספיק משיכה",
      "אולי יש מישהו מתאים יותר",
      "למה אני עדיין לא בטוח?",
      "איך יודעים אם נכון להמשיך?",
    ]) {
      await expect(page.locator(".hero-thought", { hasText: thought })).toHaveCount(1);
    }

    // המסר שנשאר קיים וקריא.
    const refrain = page.locator(".hero-refrain");
    await expect(refrain).toContainText("דייטינג הוא חיפוש.");
    await expect(refrain).toContainText("אהבה היא בנייה.");

    // ה-CTA הראשי נשאר ברור ופעיל.
    await expect(
      page.getByRole("link", { name: "קבלו עדכון כשהספר יוצא" }).first()
    ).toBeVisible();
  });

  test("stations: home cards link to dedicated pages, which cross-link and CTA to the waitlist", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // כרטיס „לפני קשר” בעמוד הבית מוביל לדף הייעודי (ולא לעוגן פנימי).
    await page
      .getByRole("link", { name: /לפני קשר/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/before-relationship$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("לפני קשר");

    // פירורי לחם נגישים + CTA לרשימת ההמתנה במצב טרום-השקה.
    await expect(page.getByRole("navigation", { name: "פירורי לחם" })).toBeVisible();
    const cta = page.getByRole("link", { name: "קבלו עדכון כשהספר יוצא" });
    await expect(cta).toHaveAttribute("href", "/waitlist");

    // מעבר לתחנה אחרת דרך הקישורים בתחתית.
    await page.getByRole("link", { name: /בתוך קשר/ }).first().click();
    await expect(page).toHaveURL(/\/inside-relationship$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("בתוך קשר");
  });

  test("waitlist: dedicated page saves a real signup", async ({ page }) => {
    await page.goto("/waitlist", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name: "קבלו עדכון כשהספר יוצא" })).toBeVisible();
    await page.getByLabel("כתובת אימייל").fill("station-signup@example.com");
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText(/נרשמת בהצלחה/)).toBeVisible();
  });

  test("RTL + no horizontal overflow on home and key pages (mobile)", async ({ browser }) => {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    for (const path of [
      "/",
      "/before-relationship",
      "/starting-again",
      "/inside-relationship",
      "/waitlist",
      "/author",
      "/faq",
      "/accessibility",
      "/checkout",
    ]) {
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
