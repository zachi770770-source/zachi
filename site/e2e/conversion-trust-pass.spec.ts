import { test, expect } from "./fixtures";

/**
 * Conversion + Trust + Positioning (טרום-השקה). מאמת את כוונת-המוצר החדשה בבית:
 *
 *  1. Funnel אחיד — טעימה עכשיו / הספר המלא בהמשך / עדכון בהשקה; אין „קנה עכשיו”.
 *  2. Trust עובדתי — אין המלצות/דירוגים מזויפים; גבולות מפורשים („לא טיפול”).
 *  3. מחיר + סוג-מוצר — פורמט (דיגיטלי), סטטוס (טרם ניתן לרכישה) ומחיר, ליד ה-CTA.
 *  4. Micro-copy ל„שאל את הספר” — שורה אחת שמסבירה מה קורה בלחיצה (3–4 שאלות → תחנה).
 *
 * הבדיקות נשענות רק על תוכן שמוצג בפועל — לא ממציאות עובדות/המלצות/רכישה.
 */

test.describe("Conversion + Trust + Positioning (pre-launch)", () => {
  test("#1 Funnel: no active-sale language anywhere on the home page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const body = page.locator("body");
    // אין ניסוח מכירה פעילה בטרום-השקה.
    for (const phrase of ["קנה עכשיו", "קנו עכשיו", "רכשו עכשיו", "הוסף לסל", "לרכישת הספר"]) {
      await expect(body).not.toContainText(phrase);
    }
    // אין קישור ישיר ל-checkout מהבית לפני פתיחת המכירה.
    await expect(page.locator('a[href="/checkout"]')).toHaveCount(0);
  });

  test("#3 Product + price: hero states format (digital), status (launching) and price near the CTA", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const hero = page.locator("main section").first();
    // תווית אחת ליד ה-CTA שמכילה פורמט (דיגיטלי), סטטוס („תושק” = טרם לרכישה) ומחיר.
    const label = hero.getByText(/דיגיטלית.*תושק.*98/);
    await expect(label).toBeVisible();
    // הפעולה הראשית (טעימה) קרובה לתווית המחיר — היררכיה ברורה.
    await expect(
      hero.getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" }),
    ).toBeVisible();
  });

  test("#4 Ask-the-book micro-copy: one line near the hero CTA explains what happens on click", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const hero = page.locator("main section").first();
    // קישור ה„שאל את הספר” בשער → /compass (המנוע הדטרמיניסטי).
    const ask = hero.getByRole("link", { name: "שאל את הספר" });
    await expect(ask).toHaveAttribute("href", "/compass");
    // שורת-הסבר צמודה: „3–4 שאלות קצרות … תחנה …” — לא ייעוץ/אבחון, לא AI.
    await expect(hero.getByText(/שאלות קצרות/)).toBeVisible();
    await expect(hero.getByText(/תחנה/)).toBeVisible();
  });

  test("#4b Floating ask-the-book bubble carries an explanatory label (tooltip + aria)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 300));
    const bubble = page.getByRole("button", { name: /שאל את הספר — / });
    await expect(bubble).toHaveCSS("opacity", "1", { timeout: 4000 });
    // תווית מסבירה (title) — לא רק אייקון/מילה בודדת.
    await expect(bubble).toHaveAttribute("title", /שאלות קצרות/);
    await ctx.close();
  });

  test("#2 Trust: fact-based band exists with explicit boundaries and NO fake social proof", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trust = page.locator('[aria-labelledby="trust-heading"]');
    await expect(trust).toHaveCount(1);
    await trust.scrollIntoViewIfNeeded();
    await expect(trust).toBeVisible();

    // גבולות מפורשים — לא טיפול / לא אבחון.
    await expect(trust).toContainText("לא טיפול");
    await expect(trust).toContainText("לא אבחון");
    // קישור אמיתי למחבר (אמון אנושי מבוסס-עובדה).
    await expect(trust.locator('a[href="/author"]')).toBeVisible();

    // אין social-proof מזויף: אין „קוראים אומרים”, אין דירוג/כוכבים, אין מספרי-נרשמים.
    await expect(trust).not.toContainText("קוראים אומרים");
    await expect(trust).not.toContainText("המלצות");
    await expect(trust.locator('[aria-label*="כוכב"], .stars, [class*="star"]')).toHaveCount(0);
  });

  test("#1b Waitlist framed as a launch update (not a generic list), and still submits", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const waitlist = page.locator("#waitlist");
    await waitlist.scrollIntoViewIfNeeded();
    // מסגור עדכון-השקה: „לפני ההשקה” + „קבלו עדכון כשהספר יוצא”.
    await expect(waitlist).toContainText("לפני ההשקה");
    await expect(
      waitlist.getByRole("heading", { name: "קבלו עדכון כשהספר יוצא" }),
    ).toBeVisible();
    // עדיין נרשם בהצלחה.
    await waitlist.getByLabel("כתובת אימייל").fill("launch-update@example.com");
    await waitlist.getByRole("checkbox").click();
    await waitlist.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText(/נרשמת בהצלחה/)).toBeVisible();
  });

  test("#7 Mobile: trust band is a compact section, not another full screen", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    const trust = page.locator('[aria-labelledby="trust-heading"]');
    await trust.scrollIntoViewIfNeeded();
    const box = await trust.boundingBox();
    // רצועה קומפקטית — פחות מגובה מסך מלא במובייל (844), ולא „מסך שלם”.
    expect(box!.height, "trust band should stay compact on mobile").toBeLessThan(560);
    await ctx.close();
  });
});
