import { test, expect } from "./fixtures";

/**
 * בלוקי הזיהוי-העצמי — שאלת המוכנות + הדפוסים הלא-מודעים, וריקוד ההיקשרות.
 *
 * **הבדיקה עברה מסלול, לא נחלשה.** הבלוקים האלה ישבו ב-/book בין „למי הספר”
 * ל„השיטה”, כלומר ~2,000px של חומר-לימוד בתוך מסלול-הרכישה. הם עברו אל
 * `/guide/attachment-styles` — עמוד-החיפוש הקנוני של הנושא, שהיה ממילא יעד
 * ההעמקה מ-/book. שום תוכן לא הוסר ולא שוכפל.
 *
 * הבדיקה שומרת עכשיו על שלושה דברים במקום אחד:
 *   1. כל התוכן המאושר עדיין מוצג — באותה קפדנות, במיקומו החדש.
 *   2. הוא מוצג **בדיוק פעם אחת באתר** (אין שכפול בין /book למדריך).
 *   3. הקישור-הפנימי מ-/book נשמר, כך שהמבקר והסורק עדיין מגיעים לשם.
 */

const GUIDE = "/guide/attachment-styles";

test("the self-recognition content lives on its canonical guide, in full", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(GUIDE, { waitUntil: "networkidle" });

  // שאלת המוכנות + ציטוט הפתיחה
  await expect(page.locator("#patterns")).toHaveCount(1);
  await expect(page.getByText("מה אני מביא/ה לקשר כרגע?")).toBeVisible();
  await expect(page.getByText(/ששכחתי להיות בן אדם אמיתי/)).toBeVisible();

  // הדפוסים הלא מודעים — שלוש השורות
  await expect(page.getByText("מלכודת ההישגיות")).toBeVisible();
  await expect(page.getByText("דפוס ההימנעות")).toBeVisible();
  await expect(page.getByText("תסביך המרפא/ה")).toBeVisible();

  // ריקוד ההיקשרות + משפט ההבטחה + שאלה סוגרת
  await expect(page.locator("#attachment")).toHaveCount(1);
  await expect(page.getByText(/מקום בטוח לחזור אליו/)).toBeVisible();
  await expect(page.getByText("מאיזו עבודה פנימית אתם נמנעים?")).toBeVisible();

  // CTA יחיד בסוף הבלוק → טעימה (מונח אחיד)
  const cta = page.locator('#attachment a[href="/preview"]');
  await expect(cta).toHaveCount(1);
  await expect(cta).toContainText("קראו טעימה מהספר");

  // בתוך המדריך עצמו אין קישור-העמקה אל המדריך — קישור לעצמו אינו הרחבה.
  await expect(page.locator(`#attachment a[href="${GUIDE}"]`)).toHaveCount(0);
});

test("the same content is not duplicated on /book, and the internal link survives", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book", { waitUntil: "networkidle" });

  // הבלוקים אינם מרונדרים כאן יותר — אין כוונת-חיפוש כפולה מול המדריך.
  await expect(page.locator("#patterns")).toHaveCount(0);
  await expect(page.locator("#attachment")).toHaveCount(0);
  await expect(page.getByText("מלכודת ההישגיות")).toHaveCount(0);

  // אבל הדרך לשם נשמרה — קישור פנימי אמיתי, שמגיע לעמוד תקין עם h1.
  const link = page.locator(`main a[href="${GUIDE}"]`).first();
  await expect(link).toBeVisible();
  const res = await page.goto(GUIDE, { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBeLessThan(400);
  await expect(page.locator("h1")).toHaveCount(1);
});
