import { test, expect, type Page } from "./fixtures";

/**
 * Reader Bonus System — „ערכת הכלים הדיגיטלית לקורא”.
 *
 * מאמת: עמוד /reader מציג את ההצעה, הכלים לפי-צורך, CTA-אמזון וטופס-הפעלה;
 * `reader_bonus_view` נורה פעם אחת; שער-הכניסה /reader/kit חוסם ללא אסימון
 * תקין (ללא enumeration); וזרימת ההפעלה המלאה claim → approve → kit עובדת
 * מקצה-לקצה מול מאגר-הזיכרון (READER_ALLOW_MEMORY) של שרת-הבדיקה.
 */

const CONSENT_KEY = "cookie-consent";
const ADMIN_TOKEN = "e2e-reader-admin-token"; // תואם ל-env בשרת הבדיקה בלבד.

/** מזריק הסכמת-אנליטיקה + dataLayer אמיתי לפני טעינת העמוד. */
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
  test("renders the offer, the by-need kit, an Amazon CTA, and the activation form", async ({ page }) => {
    const resp = await page.goto("/reader", { waitUntil: "domcontentloaded" });
    expect(resp?.status()).toBeLessThan(400);

    // הצעת-הערך + הכללת-הערכה (מיצוב, לא טריק).
    await expect(page.getByRole("heading", { level: 1 })).toContainText("כלים");
    await expect(page.getByRole("heading", { name: "מה כלול בערכה" })).toBeVisible();
    await expect(page.getByText("כלול ללא תשלום נוסף לרוכשי הספר.")).toBeVisible();

    // ה-CTA היחיד לרכישה — אמזון (ערוץ הרכישה היחיד).
    const amazon = page.getByRole("link", { name: /לקניית הספר באמזון/ });
    await expect(amazon).toHaveAttribute("href", /amazon\.com/);

    // אזור ההפעלה למי שכבר רכש — שדות בלבד, ללא העלאת קובץ.
    await expect(page.getByRole("heading", { name: /כבר רכשתם/ })).toBeVisible();
    await expect(page.getByLabel("שם", { exact: true })).toBeVisible();
    await expect(page.getByLabel("אימייל", { exact: true })).toBeVisible();
    await expect(page.getByLabel("מזהה הזמנה מאמזון", { exact: true })).toBeVisible();
  });

  test("reader_bonus_view fires exactly once", async ({ page }) => {
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
    // ללא PII — רק שם-האירוע.
    expect(Object.keys(evs[0]).sort()).toEqual(["event"]);
  });
});

test.describe("Reader Bonus — gated kit", () => {
  test("blocks access with no token — uniform 'no access', never the kit content", async ({ page }) => {
    await page.goto("/reader/kit", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByText("7 ימים לבהירות")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /להפעלת ערכת הקורא/ })).toBeVisible();
  });

  test("blocks a malformed / non-existent token identically (anti-enumeration)", async ({ page }) => {
    await page.goto("/reader/kit?token=not-a-real-token", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByText("7 ימים לבהירות")).toHaveCount(0);

    // אסימון בעל צורה תקינה אך לא-קיים → אותה תשובה בדיוק.
    await page.goto(`/reader/kit?token=${"a".repeat(32)}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByText("7 ימים לבהירות")).toHaveCount(0);
  });
});

test.describe("Reader Bonus — full activation flow (claim → approve → kit)", () => {
  test("a claimant becomes pending, an admin approval mints access, and the kit opens", async ({ page }) => {
    const email = `dana+${Date.now()}@example.com`;

    // 1) הפעלה: הבקשה נשמרת כ-pending — לעולם לא „מאומת” כאן.
    const claim = await page.request.post("/api/reader/claim", {
      data: {
        name: "דנה",
        email,
        orderRef: "701-1234567-1234567",
        consent: true,
        source: "reader",
      },
    });
    expect(claim.status()).toBe(200);
    expect(await claim.json()).toEqual({ success: true, status: "pending" });

    // 2) אישור ידני (אדמין, סוד-שרת) → מפיק אסימון-גישה + קישור-ערכה.
    const approve = await page.request.post("/api/reader/approve", {
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      data: { email, action: "approve" },
    });
    expect(approve.status()).toBe(200);
    const body = await approve.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("approved");
    expect(body.kitUrl).toMatch(/\/reader\/kit\?token=[0-9a-f]{32}$/);
    const token = new URL(body.kitUrl).searchParams.get("token")!;

    // 3) שער-הכניסה נפתח עם האסימון התקין — הערכה מוצגת.
    await withAnalytics(page);
    await page.goto(`/reader/kit?token=${token}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "7 ימים לבהירות" })).toBeVisible();

    // אירועי המשפך של הערכה נורים.
    await page.waitForFunction(
      () =>
        ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).some(
          (e) => e.event === "reader_kit_accessed",
        ),
      { timeout: 5000 },
    );
    expect(await eventsNamed(page, "reader_kit_accessed")).toHaveLength(1);
    expect(await eventsNamed(page, "reader_bonus_approved")).toHaveLength(1);
  });

  test("a rejected email cannot reuse an old token", async ({ page }) => {
    const email = `reject+${Date.now()}@example.com`;
    await page.request.post("/api/reader/claim", {
      data: { name: "דן", email, orderRef: "701-7654321-7654321", consent: true, source: "reader" },
    });
    const approve = await page.request.post("/api/reader/approve", {
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      data: { email, action: "approve" },
    });
    const token = new URL((await approve.json()).kitUrl).searchParams.get("token")!;

    // דחייה מבטלת את הגישה.
    const rejected = await page.request.post("/api/reader/approve", {
      headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      data: { email, action: "reject" },
    });
    expect(rejected.status()).toBe(200);

    await page.goto(`/reader/kit?token=${token}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("הגישה לערכה אישית")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ערכת הכלים שלכם" })).toHaveCount(0);
  });
});
