import { test, expect } from "./fixtures";

/**
 * Conversion + Trust + Positioning (טרום-השקה). מאמת את כוונת-המוצר החדשה בבית:
 *
 *  1. Funnel אחיד — טעימה עכשיו / הספר המלא בהמשך / עדכון בהשקה; אין „קנה עכשיו”.
 *  2. Trust עובדתי — אין המלצות/דירוגים מזויפים; גבולות מפורשים („לא טיפול”).
 *  3. מחיר + סוג-מוצר — פורמט (דיגיטלי), סטטוס (טרם ניתן לרכישה) ומחיר, ליד ה-CTA.
 *  4. Micro-copy ל„שאל את הספר” — שורה אחת שמסבירה מה קורה בלחיצה (2–3 שאלות → תחנה).
 *
 * הבדיקות נשענות רק על תוכן שמוצג בפועל — לא ממציאות עובדות/המלצות/רכישה.
 */

test.describe("Conversion + Trust + Positioning (pre-launch)", () => {
  test("#1 Funnel: no active-sale language anywhere on the home page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const body = page.locator("body");
    // אין ניסוח מכירה פעילה בטרום-השקה.
    for (const phrase of ["קנה עכשיו", "קנו עכשיו", "רכשו עכשיו", "הוסף לסל"]) {
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
    // תווית זמינות אחת ליד ה-CTA: הספר זמין עכשיו במהדורת Kindle באמזון.
    const label = hero.getByText(/זמין עכשיו במהדורת Kindle באמזון/);
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
    // קישור ה„מה הספר אומר על המצב שלי?” בשער → /compass (המנוע הדטרמיניסטי).
    const ask = hero.getByRole("link", { name: "מה הספר אומר על המצב שלי?" });
    await expect(ask).toHaveAttribute("href", "/compass");
    // שורת-הסבר צמודה: „כמה שאלות קצרות … הקטע והכלי …” — לא ייעוץ/אבחון, לא AI.
    await expect(hero.getByText(/שאלות קצרות/)).toBeVisible();
    await expect(hero.getByText(/הקטע והכלי/)).toBeVisible();
  });

  test("#4b Floating ask-the-book bubble carries an explanatory label (tooltip + aria)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    // במובייל הגלולה נחשפת מעבר לקיפול-הראשון — גוללים מעבר לסף החשיפה.
    await page.evaluate(() => window.scrollTo(0, 700));
    const bubble = page.getByRole("button", { name: /מה הספר אומר על המצב שלי\?, / });
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

  test("#1b Home closing: Amazon is the only purchase channel (no waitlist, no email form)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const closing = page.locator("#get-the-book");
    await closing.scrollIntoViewIfNeeded();
    // סגירה פשוטה וברורה: „זמין עכשיו במהדורת Kindle באמזון” → „לרכישה באמזון”.
    await expect(closing.getByText("זמין עכשיו במהדורת Kindle באמזון")).toBeVisible();
    await expect(closing.getByRole("link", { name: "לרכישה באמזון" })).toHaveAttribute(
      "href",
      /amazon\.com\/dp\/B0GJ3SL9H2/,
    );
    // אין רשימת המתנה, אין טופס אימייל, ואין מסגור „מהדורה ישירה · בקרוב”.
    await expect(page.getByLabel("כתובת אימייל")).toHaveCount(0);
    await expect(page.locator('a[href="/waitlist"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("מהדורה ישירה · בקרוב");
  });

  test("#7 Mobile: trust band is a compact section, not another full screen", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    const trust = page.locator('[aria-labelledby="trust-heading"]');
    await trust.scrollIntoViewIfNeeded();
    const box = await trust.boundingBox();
    // רצועה דחוסה — שורה אחת נמוכה, לא section (יעד ≤180px; סף בדיקה מרווח קל).
    expect(box!.height, "trust band should stay a slim strip on mobile").toBeLessThan(200);
    await ctx.close();
  });
});
