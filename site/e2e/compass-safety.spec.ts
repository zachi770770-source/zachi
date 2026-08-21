import { test, expect } from "./fixtures";

/**
 * שער-הבטיחות של „שאל את הספר”, מקצה לקצה.
 *
 * הבדיקה רצה מול השרת של הפרויקט `chromium-free-text` (3101), שבו דגל העוזר
 * דלוק אבל **אין ספק מודל ואין מסד** — וזו בדיוק הנקודה: אם בקשה שמפעילה את
 * השער מחזירה `status: "safety"` בסביבה כזו, הוכח שהשער רץ *לפני* בדיקת
 * הזמינות, לפני המכסה, לפני האחזור ולפני כל קריאה לספק. שום נתיב אחר לא היה
 * מסוגל להחזיר את המסר הזה כאן.
 */

const BOX = "#compass-question";
const DANGER = "הוא מאיים עליי עם סכין";
const BENIGN = "איך יודעים אם זו התאמה אמיתית";

/** מחזיר „זמין” לשאלת-הזמינות בלבד; ה-POST ממשיך לשרת האמיתי. */
async function availabilityOk(page: import("@playwright/test").Page) {
  await page.route("**/api/compass", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ available: true, remaining: 3 }),
    });
  });
}

async function dismissCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "אישור הכל" });
  if (await accept.count()) await accept.first().click().catch(() => {});
}

async function ask(page: import("@playwright/test").Page, text: string) {
  await page.goto("/compass", { waitUntil: "domcontentloaded" });
  await dismissCookies(page);
  await page.locator(BOX).fill(text);
  await page.getByRole("button", { name: /^שאל את הספר$/ }).click();
}

test.describe("Compass safety gate", () => {
  test("the API answers with safety even though no provider and no database exist", async ({
    request,
  }) => {
    const res = await request.post("/api/compass", { data: { question: DANGER } });
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.status).toBe("safety");
    expect(body.category).toBe("immediate_danger");
    expect(body.severity).toBe("critical");
    expect(typeof body.answer).toBe("string");
    expect(body.answer.length).toBeGreaterThan(40);

    // (3) אין ציטוט מהספר, ואין שורת-פוקוס — הבקשה לא נגעה באחזור.
    expect(body.citation).toBeUndefined();
    expect(body.focus).toBeUndefined();
    // לא נחשפו מכסה או שאריות של נתיב „תשובה רגילה”.
    expect(body.remaining).toBeUndefined();
  });

  test("a benign question does NOT get the safety path (gate is not blocking everything)", async ({
    request,
  }) => {
    const res = await request.post("/api/compass", { data: { question: BENIGN } });
    const body = await res.json();
    // בסביבה הזו אין ספק/מסד, ולכן התשובה הצפויה היא „לא זמין” — העיקר: לא „safety”.
    expect(body.status).not.toBe("safety");
  });

  for (const [label, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    test(`the safety message is visible and accessible on ${label}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await availabilityOk(page);
      await ask(page, DANGER);

      // (5) נראה בפועל: מוכרז כ-alert, גלוי, ובתוך אזור-הצפייה.
      const alert = page.getByRole("alert");
      await expect(alert).toBeVisible();
      await expect(alert).toContainText("הבטיחות שלכם");
      await expect(alert).toBeInViewport();

      // (3) אין ציטוט מהספר.
      await expect(page.getByText("מתוך הספר")).toHaveCount(0);
      // אין שורת „על מה שווה לשים לב עכשיו”.
      await expect(page.getByText("על מה שווה לשים לב עכשיו")).toHaveCount(0);

      // (4) אין CTA לרכישה בשום מקום באזור התוצאה.
      const result = page.locator(".stuck-answer");
      await expect(result.locator('a[href*="amazon."]')).toHaveCount(0);
      await expect(result.locator('a[href="/book"]')).toHaveCount(0);
      await expect(result.locator('a[href="/preview"]')).toHaveCount(0);
    });
  }

  test("the typed question is cleared and no answer card is duplicated", async ({ page }) => {
    await availabilityOk(page);
    await ask(page, DANGER);
    await expect(page.getByRole("alert")).toBeVisible();
    // תיבת השאלה מתרוקנת (כמו בתשובה רגילה) — אין „הקלד שוב על גבי” בטעות.
    await expect(page.locator(BOX)).toHaveValue("");
    // כרטיס-תוצאה יחיד בלבד.
    await expect(page.locator(".stuck-answer")).toHaveCount(1);
  });
});
