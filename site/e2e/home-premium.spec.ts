import { test, expect } from "./fixtures";

/**
 * שיפורים ממוקדים לעמוד הבית (מעל הרדיזיין המאושר): פס עובדות, טיזר מחבר
 * בגוף ראשון, ציטוט מהספר, תיאום בקרות צפות מול באנר העוגיות, וללא גלישה
 * אופקית ב-320/360/390. התנועה המאושרת אינה משתנה כאן.
 */

// (פס-העובדות „TrustStrip” הוסר מעמוד הבית בקיצור העריכתי — הבדיקה שלו הוסרה
//  בהתאם; אין להמציא/להחזיר תוכן שלא מוצג.)

test("author teaser is written in the first person", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const author = page.locator("#author-teaser");
  await expect(author).toContainText("כתבתי את");
  await expect(author).toContainText("רציתי ליצור ספר");
  await expect(author).not.toContainText("צחי חן זיהה");
});

test("conversion journey: the Path Finder (#where) precedes the Search→Build thesis scene", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#where")).toBeVisible();
  await expect(page.locator("#thesis-heading")).toBeVisible();

  // סדר ה-DOM אחרי הקיצור/הארגון-מחדש: מגלה-המסלול (#where) *לפני* סצנת
  // Search→Build (#thesis-heading) — כדי שלחיצה על „למצוא את המסלול שלי” תגיע
  // לשאלון בלי לחצות את טווח ה-pin של הסצנה.
  const stationsBeforeThesis = await page.evaluate(() => {
    const stations = document.querySelector("#where");
    const thesis = document.querySelector("#thesis-heading");
    if (!thesis || !stations) return false;
    return !!(
      stations.compareDocumentPosition(thesis) &
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
  expect(stationsBeforeThesis).toBe(true);
});

test("mobile 390: assistant bubble is hidden while the cookie banner is open, and restored after consent", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  // במסכים נמוכים (מובייל) באנר העוגיות מזוין רק אחרי שה-CTA הראשי גלל אל מעל
  // פס-הבאנר (כדי שלא יכסה אותו). גוללים מעט כדי שהבאנר יופיע — עדיין הרבה לפני
  // סף חשיפת הבועה (≈0.6 מסך), כך שהבועה נשארת מוסתרת.
  await page.evaluate(() => window.scrollTo(0, 220));
  const banner = page.getByRole("region", { name: "הסכמה לשימוש בעוגיות" });
  await expect(banner).toBeVisible();

  // הבועה הצפה (position:fixed, aria-label „המצפן”) — מזוהה לפי fixed
  const fixedBubbleVisible = () =>
    page.evaluate(() => {
      const btns = Array.from(
        document.querySelectorAll('button[aria-label="המצפן: שלוש שאלות קצרות"]')
      );
      const fixed = btns.find((b) => getComputedStyle(b).position === "fixed");
      if (!fixed) return false;
      const cs = getComputedStyle(fixed);
      return (
        cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        parseFloat(cs.opacity || "1") > 0
      );
    });

  // אות-מצב מפורש מ-CookieConsent (data-attribute), לא הסקה מריווח CSS.
  // הבאנר גם שומר מקום בתחתית (לא רק z-index) והבועה מוסתרת במובייל בזמן פתיחה.
  await page.waitForFunction(
    () => document.body.getAttribute("data-cookie-banner") === "open"
  );
  expect(await fixedBubbleVisible()).toBe(false);

  await page.getByRole("button", { name: "אישור הכל" }).click();
  await expect(banner).toHaveCount(0);
  // האות המפורש מתנקה עם סגירת ההסכמה.
  await page.waitForFunction(
    () => !document.body.hasAttribute("data-cookie-banner")
  );

  // מיד אחרי ההסכמה, עדיין לפני אזור חשיפת-הבועה: הבועה מוסתרת בכוונה כדי לא
  // להתחרות בטופס ההרשמה שבשער.
  expect(await fixedBubbleVisible()).toBe(false);

  // גלילה מעבר לאזור השער חושפת את הבועה בעדינות (גלילה מיידית — דטרמיניסטית,
  // ללא smooth שעלול להיקטע מ-reflow סגירת-הבאנר).
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, window.innerHeight);
  });
  await page.waitForFunction(() => {
    const btns = Array.from(
      document.querySelectorAll('button[aria-label="המצפן: שלוש שאלות קצרות"]')
    );
    const fixed = btns.find((b) => getComputedStyle(b).position === "fixed");
    if (!fixed) return false;
    const cs = getComputedStyle(fixed);
    return cs.display !== "none" && parseFloat(cs.opacity || "1") > 0;
  });
  expect(await fixedBubbleVisible()).toBe(true);

  await ctx.close();
});

for (const w of [320, 360, 390]) {
  test(`no horizontal overflow at ${w}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y <= h; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo(0, 0);
    });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(over, `overflow at ${w}px`).toBe(false);
    await ctx.close();
  });
}

test("reduced-motion: thesis text is fully visible", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  // תחת reduced-motion אין הסתרה (motion-js לא מתווסף) — התוכן קריא במלואו.
  const thesis = page.locator("#thesis-heading");
  await thesis.scrollIntoViewIfNeeded();
  await expect(thesis).toContainText("אהבה היא בנייה.");
  await ctx.close();
});
