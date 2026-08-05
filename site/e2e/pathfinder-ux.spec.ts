import { test, expect } from "./fixtures";

/**
 * התנהגות UX של מנוע השאלון המשותף (PathFinder): איפוס תוצאה קודמת אצל מבקר
 * חוזר, והופעה מיידית של התוצאה אחרי שאלה 3 (בלי „שטח ריק”).
 */

test("returning visitor: starting to answer hides the previous compass result immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // מבקר עם תוצאה שמורה מ„המצפן”.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        "mlc.compass.v1",
        JSON.stringify({ stationId: "before-relationship", completed: true }),
      );
    } catch {
      /* ignore */
    }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();

  // מצב פתיחה: הבאנר „השלמתם את המצפן” + הדגשת התחנה מוצגים.
  await expect(where.getByText("השלמתם את המצפן")).toBeVisible();
  await expect(where.locator(".station-node[data-active]")).toHaveCount(1);

  // ברגע שנבחרת תשובה לשאלה 1 — הבאנר, התחנה הקודמת וכל CTA קודם נעלמים מיד.
  await where.getByRole("radio").first().click();
  await expect(where.getByText("השלמתם את המצפן")).toHaveCount(0);
  await expect(where.getByText(/נקודת הפתיחה שלכם/)).toHaveCount(0);
  await expect(where.locator(".station-node[data-active]")).toHaveCount(0);

  // התוצאה החדשה מופיעה רק אחרי שאלה 3.
  await where.getByRole("radio").first().click();
  await expect(where.getByText(/נקודת הפתיחה שלכם/)).toHaveCount(0);
  await where.getByRole("radio").first().click();
  await expect(where.getByText(/נקודת הפתיחה שלכם/)).toBeVisible();
});

test("result container appears promptly after question 3 and takes focus (opacity settles < 600ms)", async ({
  page,
}) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click(); // Q3 → תוצאה

  const heading = page.getByRole("article").getByRole("heading");
  await expect(heading).toBeVisible();
  // אין „שטח ריק” ממושך — ה-opacity מתייצב מהר (אנימציה ~340ms).
  await expect
    .poll(async () => heading.evaluate((el) => parseFloat(getComputedStyle(el).opacity)), {
      timeout: 600,
    })
    .toBeGreaterThan(0.9);
  // המיקוד נוחת על כותרת התוצאה (נגישות + „נחיתה” על התוצאה).
  await expect
    .poll(() =>
      page.evaluate(() =>
        (document.activeElement?.textContent ?? "").includes("נקודת הפתיחה שלכם"),
      ),
    )
    .toBe(true);
});

test("reduced-motion: the result is fully visible immediately after question 3", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  await page.getByRole("radio").first().click();
  const heading = page.getByRole("article").getByRole("heading");
  await expect(heading).toBeVisible();
  const opacity = await heading.evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(opacity).toBe(1);
});
