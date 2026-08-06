import { test, expect } from "@playwright/test";

/**
 * „שאל את הספר” — הבועה הצפה חייבת להיות נוכחת וברורה בשני המכשירים, ולהופיע מהר:
 * גם בלי גלילה כלל (טיימר-גיבוי קצר) וגם אחרי גלילה קטנה. במובייל היא מוסתרת
 * כל עוד באנר העוגיות פתוח — ולכן סוגרים אותו קודם. החלונית מיושרת לכיתוב
 * „שאל את הספר” עם כותרת-משנה של 3 שאלות — בלי שום ניסוח של צ׳אט חופשי או AI.
 */

const compass = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /שאל את הספר/ });

// הגלולה בפינה התחתונה מוסתרת כל עוד באנר-העוגיות (פס תחתון) פתוח — בשני
// המכשירים. לכן חובה לסגור אותו קודם כדי לראות/ללחוץ על הגלולה.
async function dismissCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "אישור הכל" });
  await accept.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  if (await accept.count()) {
    await accept.first().click().catch(() => {});
    await page
      .waitForFunction(() => !document.body.hasAttribute("data-cookie-banner"))
      .catch(() => {});
  }
}

test.describe("compass floating bubble", () => {
  test("desktop: bubble reveals without any scroll, then opens the drawer", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);
    // נחשפת גם בלי גלילה כלל (טיימר-גיבוי) — opacity מגיע ל-1.
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    await compass(page).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // כותרת + כותרת-משנה מיושרות ל„שאל את הספר” (3 שאלות, לא צ׳אט).
    await expect(dialog.getByText("שאל את הספר")).toBeVisible();
    await expect(
      dialog.getByText(/ענה על 3 שאלות קצרות/)
    ).toBeVisible();
    // אין ניסוח שמרמז על צ׳אט חופשי / שיחה עם AI.
    await expect(dialog.getByText(/צ.אט|בינה מלאכות|שיחה עם|AI/)).toHaveCount(0);
    // מנוע שלוש-השאלות עצמו נשאר (שאלה 1/3 מוצגת).
    await expect(dialog.getByText("שאלה 1/3")).toBeVisible();
  });

  test("desktop: bubble also reveals after a small scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await page.mouse.wheel(0, 250);
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
  });

  test("mobile: bubble reveals (after cookie banner dismissed)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    // יעד מגע נגיש (≥44px).
    const box = await compass(page).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
