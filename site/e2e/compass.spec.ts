import { test, expect } from "./fixtures";

/**
 * „המצפן” (/compass) — חוויית שלוש-שאלות דטרמיניסטית: בחירות סגורות, מיפוי
 * בצד-הלקוח, ללא AI/טקסט חופשי. כולל התקדמות, חזרה, התחלה-מחדש, persistence
 * (ביקור חוזר), הדגשת התחנה בבית, ומקלדת.
 */

test("compass: three closed questions map to a station result with factors + CTAs", async ({
  page,
}) => {
  await page.goto("/compass", { waitUntil: "networkidle" });

  // שאלה 1/3 → 2/3 → 3/3, בחירת האפשרות הראשונה (לפני קשר) בכל שאלה.
  await expect(page.getByText("שאלה 1 מתוך 3")).toBeVisible();
  await page.getByRole("radio").first().click();
  await expect(page.getByText("שאלה 2 מתוך 3")).toBeVisible();
  await page.getByRole("radio").first().click();
  await expect(page.getByText("שאלה 3 מתוך 3")).toBeVisible();
  await page.getByRole("radio").first().click();

  // תוצאה: התחנה המתאימה, שני גורמים, וקישורים לתחנה/טעימה/רשימת המתנה.
  const result = page.getByRole("article");
  await expect(result).toHaveAttribute("aria-live", "polite");
  await expect(result.getByRole("heading")).toContainText("לפני קשר");
  await expect(result.getByText("מה שהוביל לכאן")).toBeVisible();
  await expect(result.getByRole("listitem")).toHaveCount(2);
  await expect(result.locator('a[href="/before-relationship"]')).toBeVisible();
  await expect(result.locator('a[href="/preview"]')).toBeVisible();
  await expect(result.locator('a[href="/waitlist"]')).toBeVisible();
  // אין אחוזי-ביטחון
  await expect(result.getByText(/%/)).toHaveCount(0);
});

test("compass: back keeps the answer, and restart clears it", async ({ page }) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio").first().click(); // Q1
  await expect(page.getByText("שאלה 2 מתוך 3")).toBeVisible();
  await page.getByRole("button", { name: "לשאלה הקודמת" }).click();
  await expect(page.getByText("שאלה 1 מתוך 3")).toBeVisible();
  await expect(page.getByRole("radio").first()).toHaveAttribute("aria-checked", "true");

  // השלמה → תוצאה → להתחיל מחדש → חוזרים לשאלה 1.
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await expect(page.getByRole("article")).toBeVisible();
  await page.getByRole("button", { name: /להתחיל מחדש/ }).click();
  await expect(page.getByText("שאלה 1 מתוך 3")).toBeVisible();
});

test("compass: keyboard-only — focus a radio and Enter advances the flow", async ({ page }) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  const first = page.getByRole("radio").first();
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("שאלה 2 מתוך 3")).toBeVisible();
});

test("compass: persistence — after completing, a reload offers 'continue where you left off'", async ({
  page,
}) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await expect(page.getByRole("article").getByRole("heading")).toContainText("לפני קשר");

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/להמשיך מהמקום שבו עצרתם/)).toBeVisible();
  await expect(page.locator('a[href="/before-relationship"]')).toBeVisible();
  // רק מזהה התחנה + השלמה נשמרים (ללא תשובות).
  const saved = await page.evaluate(() => window.localStorage.getItem("mlc.compass.v1"));
  expect(JSON.parse(saved!)).toEqual({ stationId: "before-relationship", completed: true });
});

test("compass → home highlights the matched station with a continue CTA", async ({ page }) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await expect(page.getByRole("article")).toBeVisible();

  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();
  await expect(where.getByText("השלמתם את המצפן")).toBeVisible();
  // הבאנר מקשר לתחנה המתאימה (גם צומת המסלול מקשר אליה — לכן .first()).
  await expect(where.locator('a[href="/before-relationship"]').first()).toBeVisible();
  // התחנה המתאימה מודגשת במסלול התחנות (data-active).
  await expect(where.locator(".station-node[data-active]")).toHaveCount(1);
});

test("compass: corrupt saved data falls back to the quiz (no crash, still completes)", async ({
  page,
}) => {
  // זורעים ערך פגום ב-localStorage לפני הטעינה — האתר לא נתקע במצב „המשך”,
  // מציג את השאלון, ומאפשר להשלים. (עמידות חסימה/שגיאה מכוסה ב-unit tests.)
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("mlc.compass.v1", "{corrupt");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await expect(page.getByText("שאלה 1 מתוך 3")).toBeVisible();
  await expect(page.getByText(/להמשיך מהמקום שבו עצרתם/)).toHaveCount(0);
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await expect(page.getByRole("article").getByRole("heading")).toContainText("לפני קשר");
});
