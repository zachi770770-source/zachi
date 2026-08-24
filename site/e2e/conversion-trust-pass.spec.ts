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

  test("#3 Product + purchase: the hero pairs the sample CTA with a clear Amazon purchase action; the Kindle availability line is not duplicated in the hero", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const hero = page.locator("main section").first();
    // שתי פעולות בהיררכיה ברורה: ראשית (טעימה) ומשנית (רכישה) — יחד ליד ה-CTA.
    await expect(
      hero.getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" }),
    ).toBeVisible();
    await expect(
      hero.getByRole("link", { name: /לרכישת הספר באמזון/ }),
    ).toHaveAttribute("href", /amazon\.com\/dp\/B0GJ3SL9H2/);
    // תווית „זמין עכשיו במהדורת Kindle באמזון” הוסרה מהשער כדי לא לכפול את
    // מסר-אמזון ליד הפעולה. עובדת הזמינות/פורמט עדיין נבדקת במקטע-הסגירה
    // (ראו launch-ready / conversion) — כאן היא *אינה* מופיעה בשער.
    await expect(
      hero.getByText(/זמין עכשיו במהדורת Kindle באמזון/),
    ).toHaveCount(0);
  });

  test("#4 Ask-the-book entry point: the free-text conversational invitation lives in the path section, still linking to /compass (no-JS)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const hero = page.locator("main section").first();
    // אינו עוד בשער — לא מתחרה בשתי הפעולות הראשיות.
    await expect(
      hero.getByRole("link", { name: /ספרו במילים שלכם מה קורה/ }),
    ).toHaveCount(0);
    // חי במקטע התחנות (#path) כהזמנה חופשית לכתיבה. ללא JS זהו קישור אמיתי אל
    // /compass (אותו מנוע); הטקסט הנראה מזמין לכתוב במילים שלכם.
    const path = page.locator("#path");
    const ask = path.getByRole("link", { name: /ספרו במילים שלכם מה קורה/ });
    await expect(ask).toHaveAttribute("href", "/compass");
    await expect(path.getByText(/ספרו במילים שלכם מה קורה/)).toBeVisible();
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

  // רצועת-האמון (`trust-heading`) הוסרה: תוכנה העיקרי היה גילוי-נאות, ולכן
  // הדבר היחיד שעמוד הבית אמר על המחבר היה מה שהוא *אינו*. ביט-המחבר החליף
  // אותה. הדרישה לא השתנתה — גבול מפורש, קישור אמיתי, ואפס social-proof מזויף —
  // רק המקום שבו היא מתקיימת.
  test("#2 Trust: the author beat carries explicit boundaries and NO fake social proof", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const trust = page.locator('[aria-labelledby="author-note-heading"]');
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

  test("#7 Mobile: the trust beat never eats a whole screen", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    const trust = page.locator('[aria-labelledby="author-note-heading"]');
    await trust.scrollIntoViewIfNeeded();
    const box = await trust.boundingBox();
    // הדרישה הישנה („רצועה ≤180px”) נבעה מכך שהאמון היה גילוי-נאות בשורה אחת.
    // עכשיו זה ביט אמיתי, ולכן הגבול הוא אחר — אבל עדיין גבול: היכרות עם המחבר
    // לא מקבלת מסך מלא במובייל, אחרת היא דוחקת את הטיעון והרכישה מתחתיה.
    expect(box!.height, "the author beat must stay under one mobile viewport").toBeLessThan(844);
    await ctx.close();
  });
});
