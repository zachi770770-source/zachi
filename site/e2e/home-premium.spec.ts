import { test, expect } from "./fixtures";

/**
 * שיפורים ממוקדים לעמוד הבית (מעל הרדיזיין המאושר): תיאום בקרות צפות מול באנר
 * העוגיות, וללא גלישה אופקית ב-320/360/390. התנועה המאושרת אינה משתנה כאן.
 */

// בקיצור העמוד הוסרו מהבית: פס-העובדות („TrustStrip”), טיזר-המחבר (#author-teaser),
// מקטע „שאל את הספר” המוטמע (#where) וסצנת Search→Build (#thesis-heading). הבדיקות
// שנשענו עליהם הוסרו בהתאם — אין להמציא/להחזיר תוכן שלא מוצג.

// (הוסר) — אין יותר בועה צפה; השכבה הצפה היחידה היא הסכמת-העוגיות. הבדיקה
// שעקבה אחרי מיקומה מול באנר-העוגיות אינה רלוונטית, ובמקומה נוספה למטה
// טענה חזקה יותר: *אין* שכבה צפה שמכסה את ה-CTA הסוגר במובייל.

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

test("reduced-motion: the path-selector area is fully visible", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  // תחת reduced-motion אין הסתרה — כותרת אזור הבחירה וכרטיסי-הניווט קריאים במלואם.
  const path = page.locator("#path");
  await path.scrollIntoViewIfNeeded();
  await expect(path).toContainText("איפה אתם נמצאים עכשיו?");
  await expect(path.getByText(/אני מחפש/).first()).toBeVisible();
  await ctx.close();
});
