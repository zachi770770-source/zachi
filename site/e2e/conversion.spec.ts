import { test, expect } from "./fixtures";

/**
 * נתיב ההמרה (עודכן — אמזון הוא ערוץ הרכישה היחיד, אין רשימת המתנה). ה-Hero
 * אינו ממיר בטופס אימייל: הפעולה הדומיננטית בו היא „קראו טעימה מהספר · 2 דקות”
 * → /preview (ללא הרשמה). סגירת הבית מפנה לרכישה באמזון; /preview נשארת נגישה
 * ישירות לכולם; וההצצה האינטראקטיבית הכפולה הוסרה.
 */

test("Hero: the single dominant action is the free sample, not an email form", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator("main section").first();
  // אין שדה אימייל בשער — הטעימה נפתחת מיד וללא הרשמה.
  await expect(hero.getByLabel("כתובת אימייל")).toHaveCount(0);
  const dominant = hero.getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" });
  await expect(dominant).toHaveAttribute("href", "/preview");
});

test("home closing: Amazon is the only purchase channel, no waitlist, no email form", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // אין שום שדה אימייל בעמוד — רשימת ההמתנה הוסרה לחלוטין.
  await expect(page.getByLabel("כתובת אימייל")).toHaveCount(0);
  const closing = page.locator("#get-the-book");
  await expect(closing.getByRole("heading", { name: "הספר המלא זמין עכשיו באמזון" })).toBeVisible();
  await expect(closing.getByRole("link", { name: "לרכישה באמזון" })).toHaveAttribute(
    "href",
    /amazon\.com\/dp\/B0GJ3SL9H2/
  );
});

test("/preview is publicly accessible directly, without any registration", async ({ page }) => {
  const resp = await page.goto("/preview", { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("home path selector: four real navigation cards to the journey pages (SEO)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // הבית האישי: אזור „איפה זה פוגש אותך עכשיו?” (#path) — שער לארבע חוויות.
  await expect(page.locator("#where")).toHaveCount(0);
  const path = page.locator("#path");
  await expect(path).toHaveCount(1);
  await expect(
    path.getByRole("heading", { name: "איפה זה פוגש אותך עכשיו?" }),
  ).toBeVisible();
  // ארבעה כרטיסי-קישור אמיתיים ליעדים (SSR, ל-SEO/נגישות) — ואין עוד result-panel.
  for (const href of [
    "/before-relationship",
    "/building-relationship",
    "/inside-relationship",
    "/after-breakup",
  ]) {
    await expect(path.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  // תגובה משותפת אחת מתחת לרשת — ארבעה פאנלים ב-DOM, מוסתרים עד בחירה.
  await expect(path.locator(".path-panel")).toHaveCount(4);
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeHidden();
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

test("/preview is a single reading experience, the duplicate peek (carousel) was removed", async ({
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
  // לפני מענה — אזור התוכן של המצפן מציג שאלות בלבד; אין פעולת רכישה בגוף העמוד
  // (קישור הרכישה בניווט העליון הוא חלק מה-Header, לא מהמצפן).
  await expect(page.locator("main").getByRole("link", { name: "לרכישת הספר" })).toHaveCount(0);
});
