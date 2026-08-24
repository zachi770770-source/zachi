import { test, expect } from "./fixtures";

/**
 * Personalized Reader Journey — המטרה: להכניס את הקורא לתוך הספר מהר. שתי נקודות
 * הקצה שהתוצאה בבית מפעילה:
 *
 *  1. Preview contextual — `/preview?tool=&station=` מציג קטע קריאה אמיתי הבנוי
 *     מהתוכן המאושר של הכלי; query לא תקין → הטעימה הכללית (fallback בטוח);
 *     כניסה ישירה ל-/preview ממשיכה לעבוד.
 *  2. Compass context — `/compass?station=` מדלג על שאלת „איפה אתם?” ומתחיל
 *     בדילמה; כניסה ישירה ל-/compass ללא הקשר מתחילה רגיל מבחירת התחנה.
 *
 * הקטעים אינם מומצאים — כל אחד הוא כלי מאושר קיים מתוך ששת כלי הספר.
 */

// insight ייחודי לכל כלי — מאמת שכל תחנה מציגה קטע *שונה ואמיתי* מהספר.
const PREVIEW = [
  { tool: "fact-story-action", station: "before-relationship", insight: "כשאתה מפסיק להאמין לכל סיפור" },
  { tool: "gate-questions", station: "building-relationship", insight: "אינטימיות אמיתית נבנית בשכבות" },
  { tool: "twenty-maintenance", station: "inside-relationship", insight: "אנשים נמשכים למי שיודע לומר" },
  { tool: "quiet-check", station: "after-breakup", insight: "שקט הוא לא בהכרח דחייה" },
] as const;

for (const p of PREVIEW) {
  test(`preview ?tool=${p.tool} shows that tool's real excerpt`, async ({ page }) => {
    const resp = await page.goto(`/preview?tool=${p.tool}&station=${p.station}`, {
      waitUntil: "networkidle",
    });
    expect(resp?.status()).toBeLessThan(400);
    await expect(page.locator(".sample-reader")).toContainText(p.insight);
  });
}

test("preview after-breakup: the excerpt opens with the tool's approved breakup framing, not the dating scenario", async ({
  page,
}) => {
  await page.goto("/preview?tool=quiet-check&station=after-breakup", {
    waitUntil: "networkidle",
  });
  const reader = page.locator(".sample-reader");
  // מסגור פרידתי מאושר (personaExamples.breakup) מוביל את הקטע.
  await expect(reader).toContainText("מה לא בסדר בי");
  // ולא נפתח בתרחיש-הדייטינג הכללי של הכלי.
  await expect(reader).not.toContainText("14:00");
});

test("preview scoping: the SAME tool on a non-breakup station keeps the general dating scenario", async ({
  page,
}) => {
  await page.goto("/preview?tool=quiet-check&station=before-relationship", {
    waitUntil: "networkidle",
  });
  const reader = page.locator(".sample-reader");
  await expect(reader).toContainText("14:00");
  await expect(reader).not.toContainText("מה לא בסדר בי");
});

test("preview: invalid tool/station falls back to the general sample (no invented content)", async ({
  page,
}) => {
  await page.goto("/preview?tool=bogus&station=nope", { waitUntil: "networkidle" });
  // אין דליפת קטע-כלי; הטעימה הכללית מוצגת (הקורא קיים).
  await expect(page.locator(".sample-reader")).toBeVisible();
  await expect(page.locator(".sample-reader")).not.toContainText("שקט הוא לא בהכרח דחייה");
});

test("preview: direct /preview (no params) still works", async ({ page }) => {
  const resp = await page.goto("/preview", { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".sample-reader")).toBeVisible();
});

test("compass ?station=after-breakup skips the „where are you?” step and starts at the dilemma", async ({
  page,
}) => {
  await page.goto("/compass?station=after-breakup", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: /מה הכי מעסיק/ }),
  ).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toHaveCount(0);
});

test("compass ?station=<invalid> and direct /compass start normally at the station step", async ({
  page,
}) => {
  await page.goto("/compass?station=bogus", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();

  await page.goto("/compass", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();
});

test("journey page → real book content (contextual sample lands on a real passage)", async ({ page }) => {
  // בעבר בחירת-מצב בבית ניווטה ישירות לעמוד-המסע; מאז היא פותחת שיחה *במקום*
  // (ראו home-path.spec). עמוד-המסע נשאר חוויה מלאה — נגיש ישירות ומ-‎<a> ללא-JS
  // של הבורר — וכאן נבדקת שרשרת ההמשך שלו: הטעימה המותאמת → קטע אמיתי מהספר.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "קראו את הקטע שמתאים לשלב הזה" }).click();
  await expect(page).toHaveURL(/\/preview\?tool=fact-story-action/);
  await expect(page.locator(".sample-reader")).toContainText("כשאתה מפסיק להאמין לכל סיפור");
});
