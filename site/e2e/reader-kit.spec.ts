import { test, expect, type Page } from "./fixtures";

/**
 * Reader Bonus System — „ערכת הכלים הדיגיטלית לקורא”.
 *
 * הזרימה המלאה: רכישה באמזון → /reader → העלאת הוכחת-רכישה → pending → בדיקה
 * ידנית מאובטחת-שרת → approved → מייל עם קישור → החלפה לעוגיית-סשן HttpOnly →
 * ערכה. מאמת גם: `reader_bonus_view` פעם אחת; שער אנטי-enumeration; שאסימון
 * אינו ב-URL של הערכה ולא ב-analytics; ואימות-קובץ אמיתי (סוג לא נתמך → דחייה).
 *
 * מול שרת-הבדיקה: READER_ALLOW_MEMORY (מאגר-זיכרון) + READER_ADMIN_TOKEN.
 */

const CONSENT_KEY = "cookie-consent";
const ADMIN_TOKEN = "e2e-reader-admin-token"; // תואם ל-env בשרת הבדיקה בלבד.

// PNG תקין מינימלי — 8 בתים של חתימת PNG + מילוי. sniff מזהה לפי החתימה.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03]);

async function withAnalytics(page: Page) {
  await page.addInitScript((key) => {
    try {
      window.localStorage.setItem(
        key as string,
        JSON.stringify({ necessary: true, analytics: true, marketing: false }),
      );
    } catch {
      /* ignore */
    }
    (window as unknown as { dataLayer: unknown[] }).dataLayer = [];
  }, CONSENT_KEY);
}

type DlEvent = Record<string, unknown> & { event?: string };
async function eventsNamed(page: Page, name: string): Promise<DlEvent[]> {
  const all = await page.evaluate(
    () => (window as unknown as { dataLayer?: DlEvent[] }).dataLayer ?? [],
  );
  return all.filter((e) => e.event === name);
}

test.describe("Reader Bonus — /reader", () => {
  test("renders the offer, the by-need kit, an Amazon CTA, and a proof-upload form", async ({ page }) => {
    const resp = await page.goto("/reader", { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBeLessThan(400);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("כלים");
    await expect(page.getByRole("heading", { name: "מה כלול בערכה" })).toBeVisible();
    await expect(page.getByText("כלול ללא תשלום נוסף לרוכשי הספר.")).toBeVisible();

    const amazon = page.getByRole("link", { name: /לקניית הספר באמזון/ });
    await expect(amazon).toHaveAttribute("href", /amazon\.com/);

    // הפעלה מבוססת הוכחת-רכישה — אימייל + קובץ. אין שדה קוד/מזהה-הזמנה.
    await expect(page.getByRole("heading", { name: /כבר רכשתם/ })).toBeVisible();
    await expect(page.getByLabel("אימייל", { exact: true })).toBeVisible();
    await expect(page.getByLabel("הוכחת רכישה", { exact: true })).toBeVisible();
    await expect(page.getByText("מזהה הזמנה מאמזון")).toHaveCount(0);
    await expect(page.getByText("קוד הפעלה מהספר")).toHaveCount(0);
  });

  test("reader_bonus_view fires exactly once with no PII", async ({ page }) => {
    await withAnalytics(page);
    await page.goto("/reader", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "reader_bonus_view",
        ),
      { timeout: 5000 },
    );
    const evs = await eventsNamed(page, "reader_bonus_view");
    expect(evs).toHaveLength(1);
    expect(Object.keys(evs[0]).sort()).toEqual(["event"]);
  });
});

test.describe("Reader Bonus — gated kit", () => {
  test("blocks access with no session cookie — uniform 'no access', never the kit content", async ({ page }) => {
    await page.goto("/reader/kit", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByText("מסלול 7 ימים לבהירות")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /להפעלת ערכת הקורא/ })).toBeVisible();
  });

  test("a malformed or non-existent session cookie is blocked identically (anti-enumeration)", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "reader_session", value: "garbage", url: baseURL! }]);
    await page.goto("/reader/kit", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();

    await context.clearCookies();
    await context.addCookies([{ name: "reader_session", value: "a".repeat(64), url: baseURL! }]);
    await page.goto("/reader/kit", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toHaveCount(0);
  });
});

test.describe("Reader Bonus — full manual-review flow (upload → pending → approve → email → kit)", () => {
  test("upload proof → pending; admin approves → enter link opens the kit via HttpOnly cookie, no token in URL", async ({ page, context }) => {
    const email = `dana+${Date.now()}@example.com`;

    // 1) העלאת הוכחת-רכישה → pending (לעולם לא „מאומת” כאן).
    const claim = await page.request.post("/api/reader/claim", {
      multipart: {
        email,
        consent: "true",
        proof: { name: "receipt.png", mimeType: "image/png", buffer: PNG },
      },
    });
    expect(claim.status()).toBe(200);
    expect(await claim.json()).toEqual({ success: true, status: "pending" });

    // 2) בדיקה ידנית מאובטחת-שרת → approve → קישור-כניסה עם אסימון חד-פעמי.
    const review = await page.request.post("/api/reader/review", {
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      data: { email, action: "approve" },
    });
    expect(review.status()).toBe(200);
    const body = await review.json();
    expect(body.status).toBe("approved");
    expect(body.enterUrl).toMatch(/\/api\/reader\/enter\?token=[0-9a-f]{64}$/);

    // 3) לחיצה על קישור-הכניסה → עוגיית-סשן HttpOnly + redirect נקי ל-/reader/kit.
    await withAnalytics(page);
    await page.goto(body.enterUrl, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/reader\/kit$/);
    expect(page.url()).not.toContain("token");
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "מסלול 7 ימים לבהירות" })).toBeVisible();

    // העוגייה HttpOnly, והאסימון אינו נחשף ב-analytics/URL.
    const session = (await context.cookies()).find((c) => c.name === "reader_session");
    expect(session?.httpOnly).toBe(true);
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "reader_kit_accessed",
        ),
      { timeout: 5000 },
    );
    expect(await eventsNamed(page, "reader_kit_accessed")).toHaveLength(1);
    expect(await eventsNamed(page, "reader_bonus_approved")).toHaveLength(1);
    const serialized = JSON.stringify(await page.evaluate(() => (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []));
    expect(serialized).not.toContain(session!.value);
  });

  test("the real browser form uploads a proof and shows the pending state (no fake 'verified')", async ({ page }) => {
    await page.goto("/reader", { waitUntil: "domcontentloaded" });
    await page.getByLabel("אימייל", { exact: true }).fill(`form+${Date.now()}@example.com`);
    await page.getByLabel("הוכחת רכישה", { exact: true }).setInputFiles({
      name: "receipt.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await page.getByLabel(/אני מאשר/).check();
    await page.getByRole("button", { name: "שלחו לאישור" }).click();

    await expect(page.getByText("קיבלנו את הבקשה ואת הוכחת הרכישה.")).toBeVisible();
    await expect(page.getByText(/עדיין לא אושרה/)).toBeVisible();
  });

  test("a spoofed file whose bytes are not an image/PDF is rejected (real type validation)", async ({ page }) => {
    const res = await page.request.post("/api/reader/claim", {
      multipart: {
        email: `bad+${Date.now()}@example.com`,
        consent: "true",
        proof: { name: "fake.png", mimeType: "image/png", buffer: Buffer.from("totally not an image") },
      },
    });
    expect(res.status()).toBe(400);
  });

  test("the proof is never public — the review/proof endpoint requires the admin bearer", async ({ page }) => {
    const email = `priv+${Date.now()}@example.com`;
    await page.request.post("/api/reader/claim", {
      multipart: { email, consent: "true", proof: { name: "r.png", mimeType: "image/png", buffer: PNG } },
    });
    // ללא bearer → 401, ההוכחה אינה נחשפת.
    const noAuth = await page.request.get(`/api/reader/review?email=${encodeURIComponent(email)}&proof=1`);
    expect(noAuth.status()).toBe(401);
    // עם bearer → נגיש לבודק בלבד.
    const withAuth = await page.request.get(`/api/reader/review?email=${encodeURIComponent(email)}&proof=1`, {
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    expect(withAuth.status()).toBe(200);
    expect(withAuth.headers()["content-type"]).toContain("image/png");
  });
});
