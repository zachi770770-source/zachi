import { test, expect, type Page } from "./fixtures";

/**
 * Reader Bonus System — „ערכת הכלים הדיגיטלית לקורא”.
 *
 * מאמת: עמוד /reader מציג את ההצעה, הכלים לפי-צורך, CTA-אמזון וטופס-הפעלה
 * (אימייל + קוד מהספר — לא מזהה-הזמנה); `reader_bonus_view` נורה פעם אחת;
 * שער-הכניסה /reader/kit חוסם ללא סשן תקין (ללא enumeration); וזרימת ההפעלה
 * המלאה code → session-cookie → kit עובדת מקצה-לקצה מול מאגר-הזיכרון
 * (READER_ALLOW_MEMORY) + קוד-הבדיקה (READER_ACCESS_CODES) של שרת-הבדיקה.
 * האסימון לעולם אינו ב-URL ולא ב-analytics.
 */

const CONSENT_KEY = "cookie-consent";
const ACCESS_CODE = "MEETINGS-2026"; // תואם ל-env בשרת הבדיקה בלבד.

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
  test("renders the offer, the by-need kit, an Amazon CTA, and a code-based activation form", async ({ page }) => {
    const resp = await page.goto("/reader", { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBeLessThan(400);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("כלים");
    await expect(page.getByRole("heading", { name: "מה כלול בערכה" })).toBeVisible();
    await expect(page.getByText("כלול ללא תשלום נוסף לרוכשי הספר.")).toBeVisible();

    const amazon = page.getByRole("link", { name: /לקניית הספר באמזון/ });
    await expect(amazon).toHaveAttribute("href", /amazon\.com/);

    // הפעלה מבוססת-קוד — אימייל + קוד מהספר. אין שדה „מזהה הזמנה מאמזון”.
    await expect(page.getByRole("heading", { name: /כבר רכשתם/ })).toBeVisible();
    await expect(page.getByLabel("אימייל", { exact: true })).toBeVisible();
    await expect(page.getByLabel("קוד הפעלה מהספר", { exact: true })).toBeVisible();
    await expect(page.getByText("מזהה הזמנה מאמזון")).toHaveCount(0);
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

    // well-formed shape but not a real session → same response exactly.
    await context.clearCookies();
    await context.addCookies([{ name: "reader_session", value: "a".repeat(64), url: baseURL! }]);
    await page.goto("/reader/kit", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toHaveCount(0);
  });
});

test.describe("Reader Bonus — full activation flow (code → session cookie → kit)", () => {
  test("a valid book code opens the kit via an HttpOnly cookie, with no token in the URL", async ({ page, context }) => {
    const email = `dana+${Date.now()}@example.com`;

    // 1) הפעלה עם הקוד מהספר → 200; הגישה נפתחת מיד (אין pending, אין אישור ידני).
    const activate = await page.request.post("/api/reader/activate", {
      data: { email, code: ACCESS_CODE, consent: true },
    });
    expect(activate.status()).toBe(200);
    expect(await activate.json()).toEqual({ ok: true });

    // עוגיית-הסשן נשמרה, היא HttpOnly, ואין אסימון בגוף התשובה.
    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === "reader_session");
    expect(session?.value).toMatch(/^[0-9a-f]{64}$/);
    expect(session?.httpOnly).toBe(true);

    // 2) שער-הכניסה נפתח דרך העוגייה — ה-URL נקי מאסימון.
    await withAnalytics(page);
    await page.goto("/reader/kit", { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("token");
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "מסלול 7 ימים לבהירות" })).toBeVisible();

    // reader_kit_accessed נורה, וללא אסימון/PII.
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "reader_kit_accessed",
        ),
      { timeout: 5000 },
    );
    const evs = await eventsNamed(page, "reader_kit_accessed");
    expect(evs).toHaveLength(1);
    const serialized = JSON.stringify(evs);
    expect(serialized).not.toContain(session!.value);
    expect(serialized).not.toMatch(/token/i);
  });

  test("the real activation form (email + code) submits, sets the cookie, and redirects to the kit", async ({ page, context }) => {
    await withAnalytics(page);
    await page.goto("/reader", { waitUntil: "domcontentloaded" });

    await page.getByLabel("אימייל", { exact: true }).fill(`form+${Date.now()}@example.com`);
    await page.getByLabel("קוד הפעלה מהספר", { exact: true }).fill(ACCESS_CODE);
    await page.getByLabel(/אני מאשר/).check();
    await page.getByRole("button", { name: "הפעילו את ערכת הקורא" }).click();

    // הטופס האמיתי → עוגיית-סשן HttpOnly → ניווט ל-/reader/kit, ללא token ב-URL.
    await page.waitForURL(/\/reader\/kit$/, { timeout: 8000 });
    expect(page.url()).not.toContain("token");
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toBeVisible();

    const session = (await context.cookies()).find((c) => c.name === "reader_session");
    expect(session?.httpOnly).toBe(true);

    // האירוע שנצפה אחרי הניווט (dataLayer מתאפס בכל טעינה) — כניסה לערכה.
    const accessed = await eventsNamed(page, "reader_kit_accessed");
    expect(accessed.length).toBeGreaterThanOrEqual(1);
  });

  test("an invalid code is rejected (401) and grants no access", async ({ page, context }) => {
    const res = await page.request.post("/api/reader/activate", {
      data: { email: `x+${Date.now()}@example.com`, code: "NOPE-NOPE", consent: true },
    });
    expect(res.status()).toBe(401);
    const session = (await context.cookies()).find((c) => c.name === "reader_session");
    expect(session).toBeFalsy();

    await page.goto("/reader/kit", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toHaveCount(0);
  });
});
