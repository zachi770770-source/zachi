import { test, expect } from "./fixtures";

/**
 * סקשני הזיהוי-העצמי ב-/book (בין „למי הספר” ל„השיטה”): שאלת המוכנות + הדפוסים
 * הלא-מודעים, וריקוד ההיקשרות עם משפט ההבטחה וה-CTA לטעימה. מגן על התוכן החדש
 * מפני הסרה שקטה ומאמת שה-CTA מפנה לטעימה.
 */
test("/book shows the self-recognition sections with the approved content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book", { waitUntil: "networkidle" });

  // שאלת המוכנות + ציטוט הפתיחה
  await expect(page.locator("#patterns")).toHaveCount(1);
  await expect(page.getByText("מה אני מביא/ה לקשר כרגע?")).toBeVisible();
  await expect(page.getByText(/ששכחתי להיות בן אדם אמיתי/)).toBeVisible();

  // הדפוסים הלא מודעים — שלוש שורות הטבלה
  await expect(page.getByText("מלכודת ההישגיות")).toBeVisible();
  await expect(page.getByText("דפוס ההימנעות")).toBeVisible();
  await expect(page.getByText("תסביך המרפא/ה")).toBeVisible();

  // ריקוד ההיקשרות + משפט ההבטחה + שאלה סוגרת
  await expect(page.locator("#attachment")).toHaveCount(1);
  await expect(page.getByText(/היא מרגישה כמו לחזור הביתה/)).toBeVisible();
  await expect(page.getByText("מאיזו עבודה פנימית אתם נמנעים?")).toBeVisible();

  // CTA יחיד בסוף הסקשן → טעימה (מונח אחיד)
  const cta = page.locator('#attachment a[href="/preview"]');
  await expect(cta).toHaveCount(1);
  await expect(cta).toContainText("קראו טעימה מהספר");
});
