import { test, expect } from "@playwright/test";

/**
 * „המצפן” — הבועה הצפה חייבת להיות נוכחת וברורה בשני המכשירים, ולהופיע מהר:
 * גם בלי גלילה כלל (טיימר-גיבוי קצר) וגם אחרי גלילה קטנה. במובייל היא מוסתרת
 * כל עוד באנר העוגיות פתוח — ולכן סוגרים אותו קודם.
 */

const compass = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /שאל את הספר/ });

async function dismissCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "אישור הכל" });
  if (await accept.count()) await accept.first().click().catch(() => {});
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
    await expect(page.getByRole("dialog")).toBeVisible();
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
