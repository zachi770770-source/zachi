import { test, expect, type Page } from "./fixtures";

/**
 * נתיב ההמרה. פעולת המרה דומיננטית אחת; הרשמה מוצלחת מציגה מצב-הצלחה עם
 * „לקריאת הטעימה” ושיתוף (ללא ניווט אוטומטי); כשל אימות/שרת אינו מנווט;
 * /preview נשארת נגישה ישירות לכולם; ורק חוויית תחנות אחת קיימת.
 */

const CTA = "קבלו טעימה ועדכון כשהספר יוצא";

/** טופס ההרשמה הקומפקטי שבשער מוצג ישירות (ללא כפתור-חושף). */
async function fillHeroInlineForm(page: Page, { consent }: { consent: boolean }) {
  const hero = page.locator("main section").first();
  await hero.getByLabel("כתובת אימייל").fill("reader@example.com");
  if (consent) await hero.getByRole("checkbox").click();
  await hero.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
}

test("Hero: successful registration shows success + read-sample (no auto-redirect)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await fillHeroInlineForm(page, { consent: true });

  const hero = page.locator("main section").first();
  await expect(hero.getByText(/נרשמת בהצלחה/)).toBeVisible();
  await expect(hero.getByRole("link", { name: "לקריאת הטעימה" })).toBeVisible();
  // נשארים בבית — אין ניווט אוטומטי; הטעימה נגישה דרך הכפתור.
  await expect(page).toHaveURL(/\/$/);
});

test("Hero: validation failure (no consent) does not navigate", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await fillHeroInlineForm(page, { consent: false });

  await expect(page.locator("main section").first().getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("Hero: API failure does not navigate", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "אירעה תקלה בשמירת הפרטים. נסו שוב." }),
    })
  );
  await page.goto("/", { waitUntil: "networkidle" });

  await fillHeroInlineForm(page, { consent: true });

  await expect(page.locator("main section").first().getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test("/preview is publicly accessible directly, without any registration", async ({ page }) => {
  const resp = await page.goto("/preview", { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("only one station experience remains (no duplicate static station section)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // חוויית התחנות היחידה: הבורר האינטראקטיבי #where. הסקשן הסטטי #stations הוסר.
  await expect(page.locator("#where")).toHaveCount(1);
  await expect(page.locator("#stations")).toHaveCount(0);
});

test("home sample teaser is a slim presence that links to /preview (peek moved off home)", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // ההצצה האינטראקטיבית (#sample) עברה ל-/preview; בבית נשארת נוכחות מצומצמת.
  await expect(page.locator("#sample")).toHaveCount(0);
  const teaser = page.locator("#sample-teaser");
  await expect(teaser.getByRole("link", { name: "לקריאת הטעימה" })).toHaveAttribute(
    "href",
    "/preview"
  );
});

test("the interactive peek now lives on /preview, without a duplicate conversion form", async ({
  page,
}) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  // ההצצה קיימת ב-/preview (עוגן #sample), אך ללא טופס המרה כפול —
  // PreviewClosing מחזיק את ההרשמה בסוף העמוד.
  await expect(page.locator("#sample")).toHaveCount(1);
  await expect(page.locator("#sample").getByRole("button", { name: CTA })).toHaveCount(0);
});

test("Compass (pre-launch): no conversion CTA before an answer", async ({ page }) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  // במצב טרום-השקה המצפן אינו פעיל (coming-soon), ואין פעולת המרה כלל.
  await expect(page.getByRole("button", { name: CTA })).toHaveCount(0);
});
