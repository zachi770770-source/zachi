import { test, expect, type Page } from "./fixtures";

/**
 * PHASE 16 — נתיב ההמרה. פעולת המרה דומיננטית אחת ואחידה („קבלו טעימה ועדכון…”)
 * שנפתחת לטופס inline; הרשמה מוצלחת אמיתית פותחת את /preview; כשל אימות/שרת
 * אינו מנווט; /preview נשארת נגישה ישירות לכולם; ורק חוויית תחנות אחת קיימת.
 */

const CTA = "קבלו טעימה ועדכון כשהספר יוצא";

/** ממלא ושולח את טופס ההמרה שכבר נפתח בתוך קבוצת ה-role=group שלו (Peek). */
async function fillConversionForm(page: Page, { consent }: { consent: boolean }) {
  const group = page.getByRole("group", { name: CTA });
  await group.getByLabel("כתובת אימייל").fill("reader@example.com");
  if (consent) await group.getByRole("checkbox").click();
  await group.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
}

/** טופס ההרשמה הקומפקטי שבשער מוצג ישירות (ללא כפתור-חושף). */
async function fillHeroInlineForm(page: Page, { consent }: { consent: boolean }) {
  const hero = page.locator("main section").first();
  await hero.getByLabel("כתובת אימייל").fill("reader@example.com");
  if (consent) await hero.getByRole("checkbox").click();
  await hero.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
}

test("Hero: successful registration opens /preview", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await fillHeroInlineForm(page, { consent: true });

  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

test("PeekInside conversion CTA uses the same waitlist → /preview flow", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const peek = page.locator("#sample");
  await peek.scrollIntoViewIfNeeded();
  await peek.getByRole("button", { name: CTA }).click();
  await fillConversionForm(page, { consent: true });

  await expect(page).toHaveURL(/\/preview$/);
});

test("Compass (pre-launch): no conversion CTA before an answer", async ({ page }) => {
  await page.goto("/compass", { waitUntil: "networkidle" });
  // במצב טרום-השקה המצפן אינו פעיל (coming-soon), ואין פעולת המרה כלל.
  await expect(page.getByRole("button", { name: CTA })).toHaveCount(0);
});
