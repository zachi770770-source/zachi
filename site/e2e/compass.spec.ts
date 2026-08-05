import { test, expect } from "./fixtures";

/**
 * „המצפן” (/compass) מציג את *אותו* מנוע שאלון (PathFinder) כמו הבית (#where):
 * שלוש שאלות סגורות → תחנה + כלי מעשי מהספר + פעולה אחת אמיתית. דטרמיניסטי,
 * ללא AI/טקסט חופשי. מנוע אחד, אותה תוצאה בשני המקומות.
 *
 * Q1[0]=„מחפש/ת קשר”→לפני קשר, Q2[0], Q3[0]=„לקרוא קטע”→פעולה ראשית לטעימה
 * המותאמת. הכלי לצירוף (לפני קשר, קושי 0) הוא gate-questions („בדיקת הקצב”).
 */

test("compass: three closed questions → station + tool + real actions (no %)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });

  await expect(page.getByText("שאלה 1/3")).toBeVisible();
  await page.getByRole("radio").first().click();
  await expect(page.getByText("שאלה 2/3")).toBeVisible();
  await page.getByRole("radio").first().click();
  await expect(page.getByText("שאלה 3/3")).toBeVisible();
  await page.getByRole("radio").first().click();

  const result = page.getByRole("article");
  await expect(result).toHaveAttribute("aria-live", "polite");
  await expect(result.getByRole("heading")).toContainText("לפני קשר");
  // אותה תוצאה כמו הבית: כלי מהספר + שלוש פעולות אמיתיות (טעימה מותאמת/כלי/תחנה).
  await expect(result.getByText("כלי מהספר שיכול לעזור כאן")).toBeVisible();
  await expect(
    result.locator('a[href="/preview?tool=gate-questions&station=before-relationship"]'),
  ).toBeVisible();
  await expect(result.locator('a[href="/book#tool-gate-questions"]')).toBeVisible();
  await expect(result.locator('a[href="/before-relationship"]')).toBeVisible();
  await expect(result.getByText("זו נקודת פתיחה לקריאה, לא אבחון או ייעוץ.")).toBeVisible();
  // אין אחוזי-ביטחון
  await expect(result.getByText(/%/)).toHaveCount(0);
});

test("compass: back keeps the answer, and restart clears it", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio").first().click(); // Q1
  await expect(page.getByText("שאלה 2/3")).toBeVisible();
  await page.getByRole("button", { name: "לשאלה הקודמת" }).click();
  await expect(page.getByText("שאלה 1/3")).toBeVisible();
  await expect(page.getByRole("radio").first()).toHaveAttribute("aria-checked", "true");

  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await expect(page.getByRole("article")).toBeVisible();
  await page.getByRole("button", { name: /להתחיל מחדש/ }).click();
  await expect(page.getByText("שאלה 1/3")).toBeVisible();
});

test("compass: keyboard-only — focus a radio and Enter advances the flow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  const first = page.getByRole("radio").first();
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("שאלה 2/3")).toBeVisible();
});

test("compass persists only the station id, and home highlights the matched station", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await expect(page.getByRole("article").getByRole("heading")).toContainText("לפני קשר");
  // רק מזהה התחנה + השלמה נשמרים (ללא תשובות).
  const saved = await page.evaluate(() => window.localStorage.getItem("mlc.compass.v1"));
  expect(JSON.parse(saved!)).toEqual({ stationId: "before-relationship", completed: true });

  // בבית: התחנה שהמצפן שמר מודגשת, עם באנר „המשך”.
  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();
  await expect(where.getByText("השלמתם את המצפן")).toBeVisible();
  await expect(where.locator('a[href="/before-relationship"]').first()).toBeVisible();
  await expect(where.locator(".station-node[data-active]")).toHaveCount(1);
});

test("compass: corrupt saved data still shows the quiz and completes (no crash)", async ({
  page,
}) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("mlc.compass.v1", "{corrupt");
    } catch {
      /* ignore */
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await expect(page.getByText("שאלה 1/3")).toBeVisible();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await expect(page.getByRole("article").getByRole("heading")).toContainText("לפני קשר");
});
