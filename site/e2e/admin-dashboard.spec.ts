import { test, expect, type Page } from "./fixtures";

/**
 * לוח הבקרה הניהולי (/admin).
 *
 * מאמת: העמוד מוגן (ללא כניסה → טופס, לא נתונים); כניסה עם סוד-השרת פותחת את
 * הלוח; סעיפי ה-first-party (Reader Bonus) מציגים נתוני-אמת מה-DB (memory repo);
 * וסעיפי GA4 מציגים „GA4 לא מחובר” — לא מספר מומצא (data integrity). כן נבדקים
 * טווח-זמן, נוסחת Amazon CTR, ו-RTL.
 *
 * מול שרת-הבדיקה: READER_ADMIN_TOKEN=e2e-reader-admin-token, READER_ALLOW_MEMORY,
 * ו-GA4 אינו מוגדר.
 */

const ADMIN_PW = "e2e-reader-admin-token";
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);

async function loginViaApi(page: Page) {
  const res = await page.request.post("/api/admin/login", { data: { password: ADMIN_PW } });
  expect(res.status()).toBe(200);
}

test.describe("admin dashboard — auth gate", () => {
  test("no session → shows the login form, never the dashboard data", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "לוח הבקרה" })).toBeVisible();
    await expect(page.getByLabel("סיסמת אדמין")).toBeVisible();
    await expect(page.getByRole("heading", { name: "מדדים מרכזיים" })).toHaveCount(0);
  });

  test("the real login form (wrong then right) gates access", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.getByLabel("סיסמת אדמין").fill("wrong-password");
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();

    await page.getByLabel("סיסמת אדמין").fill(ADMIN_PW);
    await page.getByRole("button", { name: "כניסה" }).click();
    await expect(page.getByRole("heading", { name: "מדדים מרכזיים" })).toBeVisible({ timeout: 8000 });
  });

  test("RTL is set on the document", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});

test.describe("admin dashboard — data integrity", () => {
  test("GA4-sourced sections show a clear 'not connected' state, not a fabricated number", async ({ page }) => {
    await loginViaApi(page);
    await page.goto("/admin?range=30d", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "מדדים מרכזיים" })).toBeVisible();
    // GA4 is not configured on the test server → explicit unsupported states (one per GA4 section).
    await expect(page.getByText("מקור הנתונים (GA4) אינו מחובר.").first()).toBeVisible();
    // The Amazon CTR definition (denominator) is shown, even without data.
    await expect(page.getByText(/÷ sessions × 100/).first()).toBeVisible();
    // Amazon clicks are never called "sales" / no revenue.
    await expect(page.getByText(/לא מכירות/).first()).toBeVisible();
  });

  test("Reader Bonus shows REAL first-party numbers end-to-end (claim → approve → dashboard)", async ({ page, context }) => {
    const email = `dash+${Date.now()}@example.com`;
    const claim = await page.request.post("/api/reader/claim", {
      multipart: { email, consent: "true", proof: { name: "r.png", mimeType: "image/png", buffer: PNG } },
    });
    expect(claim.status()).toBe(200);
    const review = await page.request.post("/api/reader/review", {
      headers: { authorization: `Bearer ${ADMIN_PW}` },
      data: { email, action: "approve" },
    });
    expect(review.status()).toBe(200);

    await loginViaApi(page);
    await page.goto("/admin?range=30d", { waitUntil: "domcontentloaded" });

    const readerSection = page.locator("#reader-bonus");
    await expect(readerSection.getByText("הפעלות שהוגשו", { exact: true })).toBeVisible();
    // The submitted/approved cards are backed by the DB (memory repo) → real digits,
    // NOT the "database not connected" unsupported state.
    await expect(readerSection.getByText("מסד הנתונים אינו מחובר")).toHaveCount(0);
    // "נתוני האתר" (first-party) source badges are present on the DB-backed KPIs.
    await expect(readerSection.getByText("נתוני האתר").first()).toBeVisible();

    // the ephemeral email/PII never appears on the dashboard.
    await expect(page.getByText(email)).toHaveCount(0);
    void context;
  });

  test("the admin tool drops the marketing chrome (no site header/footer)", async ({ page }) => {
    await loginViaApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "מדדים מרכזיים" })).toBeVisible();
    // the marketing footer ("כל הזכויות שמורות") and header nav ("שאלות נפוצות") are hidden.
    await expect(page.getByText(/כל הזכויות שמורות/)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "שאלות נפוצות" })).toHaveCount(0);
  });

  test("renders clean on mobile — no console errors, no horizontal overflow, GA4 states shown", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.setViewportSize({ width: 390, height: 844 });
    await loginViaApi(page);
    await page.goto("/admin?range=30d", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "מדדים מרכזיים" })).toBeVisible();
    await expect(page.getByText("מקור הנתונים (GA4) אינו מחובר.").first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "horizontal overflow (px)").toBeLessThanOrEqual(2);
    expect(errors, `console/page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("range picker updates the query and logout returns to the login form", async ({ page }) => {
    await loginViaApi(page);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "30 ימים" }).click();
    await page.waitForURL(/range=30d/);
    await expect(page.getByRole("heading", { name: "מדדים מרכזיים" })).toBeVisible();

    await page.getByRole("button", { name: "יציאה" }).click();
    await expect(page.getByLabel("סיסמת אדמין")).toBeVisible({ timeout: 8000 });
  });
});
