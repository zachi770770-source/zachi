import { test, expect, type Page } from "./fixtures";

/**
 * נתיב ההמרה (עודכן ל-PASS). ה-Hero כבר אינו ממיר בטופס אימייל: הפעולה
 * הדומיננטית בו היא „קראו טעימה מהספר · 2 דקות” → /preview (ללא הרשמה). הרשמה
 * לרשימת ההמתנה מרוכזת באזור הייעודי (#waitlist) ובסוף עמוד הטעימה. הרשמה
 * מוצלחת מציגה מצב-הצלחה עם „לקריאת הטעימה”; כשל אימות/שרת אינו מנווט;
 * /preview נשארת נגישה ישירות לכולם; וההצצה האינטראקטיבית הכפולה הוסרה.
 */

/** טופס ההרשמה באזור רשימת ההמתנה (#waitlist) בעמוד הבית. */
async function fillWaitlistForm(page: Page, { consent }: { consent: boolean }) {
  const waitlist = page.locator("#waitlist");
  await waitlist.scrollIntoViewIfNeeded();
  await waitlist.getByLabel("כתובת אימייל").fill("reader@example.com");
  if (consent) await waitlist.getByRole("checkbox").click();
  await waitlist.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
}

test("Hero: the single dominant action is the free sample, not an email form", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator("main section").first();
  // אין שדה אימייל בשער — הטעימה נפתחת מיד וללא הרשמה.
  await expect(hero.getByLabel("כתובת אימייל")).toHaveCount(0);
  const dominant = hero.getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" });
  await expect(dominant).toHaveAttribute("href", "/preview");
});

test("Waitlist: successful registration shows success + read-sample (no auto-redirect)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await fillWaitlistForm(page, { consent: true });

  const waitlist = page.locator("#waitlist");
  await expect(waitlist.getByText(/נרשמת בהצלחה/)).toBeVisible();
  await expect(waitlist.getByRole("link", { name: "לקריאת הטעימה" })).toBeVisible();
  // נשארים בבית — אין ניווט אוטומטי; הטעימה נגישה דרך הכפתור.
  await expect(page).toHaveURL(/\/$/);
});

test("Waitlist: validation failure (no consent) does not navigate", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await fillWaitlistForm(page, { consent: false });

  await expect(page.locator("#waitlist").getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("Waitlist: API failure does not navigate", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "אירעה תקלה בשמירת הפרטים. נסו שוב." }),
    })
  );
  await page.goto("/", { waitUntil: "networkidle" });

  await fillWaitlistForm(page, { consent: true });

  await expect(page.locator("#waitlist").getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("/preview is publicly accessible directly, without any registration", async ({ page }) => {
  const resp = await page.goto("/preview", { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home stations: one compact area of four station cards, each linking to its page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // בקיצור העמוד: מקטע „שאל את הספר” המוטמע (#where) הוסר — המנוע נשאר כגלולה
  // צפה בלבד. במקומו אזור קומפקטי אחד „שלוש תחנות ושער מעבר אחד” (#stations)
  // עם ארבעה כרטיסים, כל אחד מקשר לדף התחנה הייעודי.
  await expect(page.locator("#where")).toHaveCount(0);
  const stations = page.locator("#stations");
  await expect(stations).toHaveCount(1);
  await expect(
    stations.getByRole("heading", { name: "שלוש תחנות ושער מעבר אחד" }),
  ).toBeVisible();
  for (const href of [
    "/before-relationship",
    "/building-relationship",
    "/inside-relationship",
    "/after-breakup",
  ]) {
    await expect(stations.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
});

test("home: the repeated sample teaser was removed; /preview is reached from the hero action", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // אזור הטעימה החוזר (#sample-teaser) וההצצה האינטראקטיבית (#sample) הוסרו מהבית.
  await expect(page.locator("#sample")).toHaveCount(0);
  await expect(page.locator("#sample-teaser")).toHaveCount(0);
  // הכניסה לטעימה נשארת דרך הפעולה הראשית בשער.
  const hero = page.locator("main section").first();
  await expect(
    hero.getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" }),
  ).toHaveAttribute("href", "/preview");
});

test("/preview is a single reading experience — the duplicate peek (carousel) was removed", async ({
  page,
}) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  // חוויית קריאה אחת ורציפה: הקורא קיים, וההצצה הכפולה (#sample / tablist) הוסרה.
  await expect(page.locator(".sample-reader")).toHaveCount(1);
  await expect(page.locator("#sample")).toHaveCount(0);
  await expect(page.getByRole("tablist")).toHaveCount(0);
});

test("Compass (pre-launch): no purchase CTA before an answer", async ({ page }) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  // לפני מענה — המצפן מציג שאלות בלבד; אין פעולת רכישה על העמוד.
  await expect(page.getByRole("link", { name: "לרכישת הספר" })).toHaveCount(0);
});
