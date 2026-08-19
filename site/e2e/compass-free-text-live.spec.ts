import { test, expect } from "./fixtures";

/**
 * רגרסיה על *המשטח החופשי האמיתי* של „שאל את הספר” (/compass כשדגל העוזר דלוק).
 * הפרויקט `chromium-free-text` ב-playwright.config מריץ את הקובץ הזה מול שרת
 * שני (3101) עם COMPASS_ASSISTANT_ENABLED=true; המשטח המודרך (3100) אינו נוגע.
 *
 * הבאג שנסגר: הטופס רונדר לפני שתשובת הזמינות חזרה, וכשהיא הגיעה עם „לא זמין”
 * הוא הוחלף במסך „בקרוב” — תיבת הכתיבה נעלמה באמצע ההקלדה, הטקסט אבד והפוקוס
 * נפל ל-body.
 *
 * תגובת הזמינות מיורטת ומוחזקת ב„שער” מפורש (ולא בהשהיית זמן), כך שהבדיקה
 * דטרמיניסטית לחלוטין: כל עוד השער סגור התשובה *לא* הגיעה, ואפשר לקבוע בוודאות
 * מה אמור להיות על המסך. הגוף המוחזר זהה למה שמחזיר src/app/api/compass/route.ts.
 */

const BOX = "#compass-question";
const QUESTION = "למה היא מתרחקת ממני אחרי כמה דייטים טובים";
const SOON_TITLE = "אפשרות „שאלו את הספר” תיפתח בהמשך";

/** מיירט את שאלת-הזמינות ומחזיק אותה עד ש-`release` נקרא. */
function gateAvailability(page: import("@playwright/test").Page) {
  let open!: (action: "ok" | "unavailable" | "fail") => void;
  const gate = new Promise<"ok" | "unavailable" | "fail">((resolve) => {
    open = resolve;
  });
  const routed = page.route("**/api/compass", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const action = await gate;
    if (action === "fail") return route.abort("failed");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        action === "ok" ? { available: true, remaining: 3 } : { available: false },
      ),
    });
  });
  return { ready: routed, release: (action: "ok" | "unavailable" | "fail") => open(action) };
}

async function openCompass(page: import("@playwright/test").Page) {
  await page.goto("/compass", { waitUntil: "domcontentloaded" });
}

/** סגירת באנר העוגיות אם הוא כבר מוצג (בדיקה מיידית, בלי timeout). */
async function dismissCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "אישור הכל" });
  if (await accept.count()) await accept.first().click().catch(() => {});
}

test.describe("compass free-text surface, availability never destroys the question box", () => {
  test("no interactive question box exists before availability is known", async ({ page }) => {
    const { ready } = gateAvailability(page); // השער נשאר סגור לכל אורך הבדיקה
    await ready;
    await openCompass(page);

    // כל עוד לא ידוע אם העוזר פתוח: מצב טעינה בלבד, בלי תיבה ובלי כפתור שליחה.
    await expect(page.getByRole("status").first()).toBeVisible();
    await expect(page.locator(BOX)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^שאל את הספר$/ })).toHaveCount(0);
  });

  test("available:true reveals the box only when ready, and typing survives", async ({ page }) => {
    const { ready, release } = gateAvailability(page);
    await ready;
    await openCompass(page);

    await expect(page.locator(BOX)).toHaveCount(0);
    await dismissCookies(page);
    release("ok");

    const box = page.locator(BOX);
    await expect(box).toBeVisible();
    await box.click();
    await page.keyboard.type(QUESTION, { delay: 40 });

    await expect(box).toBeVisible();
    await expect(box).toHaveValue(QUESTION);
    await expect(box).toBeFocused();
  });

  test("available:false never exposes a box that can vanish mid-typing", async ({ page }) => {
    const { ready, release } = gateAvailability(page);
    await ready;
    await openCompass(page);

    await expect(page.locator(BOX)).toHaveCount(0);
    release("unavailable");

    await expect(page.getByText(SOON_TITLE)).toBeVisible();
    await expect(page.locator(BOX)).toHaveCount(0);
  });

  test("a failing availability request never exposes the box either", async ({ page }) => {
    const { ready, release } = gateAvailability(page);
    await ready;
    await openCompass(page);

    await expect(page.locator(BOX)).toHaveCount(0);
    release("fail");

    await expect(page.getByText(SOON_TITLE)).toBeVisible();
    await expect(page.locator(BOX)).toHaveCount(0);
  });

  test("an assistant that closes between load and submit keeps the typed question", async ({
    page,
  }) => {
    await page.route("**/api/compass", async (route) => {
      const body =
        route.request().method() === "GET"
          ? { available: true, remaining: 3 }
          : { available: false, status: "unavailable" };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    });

    await openCompass(page);
    await dismissCookies(page);
    const box = page.locator(BOX);
    await expect(box).toBeVisible();
    await box.fill(QUESTION);
    await page.getByRole("button", { name: /^שאל את הספר$/ }).click();

    // הודעה בתוך הממשק — הטופס נשאר, והשאלה שנכתבה לא אבדה.
    await expect(page.getByText(/העוזר ייפתח לשימוש בהמשך/)).toBeVisible();
    await expect(box).toBeVisible();
    await expect(box).toHaveValue(QUESTION);
  });
});
