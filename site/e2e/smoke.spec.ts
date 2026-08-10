import { test, expect, type Page } from "./fixtures";

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

const STATIC_ROUTES = [
  "/",
  "/before-relationship",
  "/building-relationship",
  "/after-breakup",
  "/starting-again",
  "/inside-relationship",
  "/waitlist",
  "/preview",
  "/compass",
  "/author",
  "/faq",
  "/contact",
  "/terms",
  "/privacy",
  "/shipping-returns",
  "/checkout",
];

for (const route of STATIC_ROUTES) {
  test(`${route} loads with no console/page errors and no horizontal overflow`, async ({
    page,
  }) => {
    const errors = trackErrors(page);
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    expect(errors).toEqual([]);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });
}

test("unknown route renders the branded 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "העמוד לא נמצא" })).toBeVisible();
});

test("header and footer links all resolve (no broken internal links)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hrefs = await page.$$eval("header a[href], footer a[href]", (els) =>
    Array.from(new Set(els.map((e) => e.getAttribute("href")))).filter(
      (h): h is string => !!h && h.startsWith("/") && !h.startsWith("//")
    )
  );

  for (const href of hrefs) {
    const response = await page.goto(href.split("#")[0] || "/", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status(), `link ${href}`).toBeLessThan(400);
  }
});

test("mobile menu opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "פתיחת תפריט ניווט" }).click();
  await expect(page.getByRole("link", { name: "שאלות נפוצות" }).last()).toBeVisible();

  await page.getByRole("button", { name: "סגירת תפריט" }).click();
  await expect(page.getByRole("button", { name: "סגירת תפריט" })).toBeHidden();
});

test("FAQ (native details) opens an answer", async ({ page }) => {
  await page.goto("/faq", { waitUntil: "networkidle" });
  await page.getByText("למי הספר מתאים?", { exact: true }).click();
  await expect(page.getByText(/שלוש תחנות בדרך לאהבה/)).toBeVisible();
});

test("cookie consent: accept all hides the banner without crashing the app", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/", { waitUntil: "networkidle" });

  // הבאנר מזוין רק אחרי גלילה קלה במסכים נמוכים (כדי לא לכסות את ה-CTA הראשי).
  await page.evaluate(() => window.scrollTo(0, 200));
  const consentBanner = page.getByRole("region", { name: "הסכמה לשימוש בעוגיות" });
  await expect(consentBanner).toBeVisible();
  await page.getByRole("button", { name: "אישור הכל" }).click();
  await expect(consentBanner).toBeHidden();

  // regression guard: a bad useSyncExternalStore snapshot previously crashed
  // the whole React tree here with "Maximum update depth exceeded".
  expect(errors.join("\n")).not.toContain("Maximum update depth exceeded");

  const consent = await page.evaluate(() => localStorage.getItem("cookie-consent"));
  expect(JSON.parse(consent ?? "{}")).toEqual({
    necessary: true,
    analytics: true,
    marketing: true,
  });

  await page.reload({ waitUntil: "networkidle" });
  await expect(consentBanner).toBeHidden();
});

test("sticky purchase bar is hidden during pre-launch", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  // הבאנר מזוין בגלילה במובייל; גוללים מעט ואז מאשרים כדי לסגור אותו.
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.getByRole("button", { name: "אישור הכל" }).click();

  const bar = page.getByRole("region", { name: "רכישה מהירה" });
  await expect(bar).toBeHidden();

  // גם לאחר גלילה מעבר ל-Hero — אין פס רכישה במצב טרום-השקה.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await expect(bar).toBeHidden();
});

test("contact form fails safely (clear Hebrew error) when email delivery is not configured", async ({
  page,
}) => {
  // בסביבת הבדיקה אין ספק מייל מוגדר. ההתנהגות הנכונה (P0): הטופס מציג כשל
  // ברור בעברית, ולעולם לא „הצלחה” מזויפת. מסלול ההצלחה מכוסה בבדיקות היחידה
  // של המתאם ושל ה-route.
  await page.goto("/contact", { waitUntil: "networkidle" });
  await page.getByLabel("שם").fill("בודק אוטומטי");
  await page.getByLabel("אימייל או טלפון").fill("tester@example.com");
  await page.getByLabel("נושא").fill("בדיקה");
  await page.getByLabel("הודעה").fill("זוהי הודעת בדיקה אוטומטית לצורך אימות הטופס.");
  await page.getByRole("button", { name: "שליחת הודעה" }).click();
  await expect(page.getByText("שליחת ההודעה נכשלה")).toBeVisible();
  await expect(page.getByText("ההודעה נשלחה בהצלחה")).toHaveCount(0);
});

test("waitlist form submits successfully", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const waitlist = page.locator("#waitlist");
  await waitlist.getByLabel("כתובת אימייל").fill("waitlisttest@example.com");
  await waitlist.getByRole("checkbox").click();
  await waitlist.getByRole("button", { name: "עדכנו אותי כשהמהדורה הישירה תיפתח" }).click();
  await expect(page.getByText(/נרשמת בהצלחה/)).toBeVisible();
});

test("checkout is closed during pre-launch (no form, no payment)", async ({
  page,
}) => {
  await page.goto("/checkout?format=digital", { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { name: "הרכישה הישירה באתר עדיין לא נפתחה" })
  ).toBeVisible();
  // אין טופס וללא הדגמת תשלום.
  await expect(page.getByLabel("שם מלא")).toHaveCount(0);
  await expect(page.getByLabel(/אימייל/)).toHaveCount(0);
});

test("legacy URLs: explicit per-target mapping (301 semantic, 410 for gone article subpaths)", async ({
  request,
}) => {
  // טבלת המיפוי (proxy.ts) — כל יעד נבחר במפורש, אין 301 שרירותי:
  //   /about    → /author (301)  — „אודות” → עמוד המחבר.
  //   /articles → /book   (301)  — אינדקס-מאמרים ישן → עמוד הספר (אין בלוג חלופי).
  const redirects: [string, string][] = [
    ["/about", "/author"],
    ["/articles", "/book"],
  ];
  for (const [from, to] of redirects) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), `status for ${from}`).toBe(301);
    const location = res.headers()["location"] ?? "";
    expect(new URL(location, "http://localhost").pathname, `target for ${from}`).toBe(to);
  }

  // כתובות-מאמר בודדות מעולם לא קיימו ואין להן תחליף → 410 Gone (לא 301 שרירותי).
  for (const gone of ["/articles/some-old-post", "/articles/2024/dating-tips"]) {
    const res = await request.get(gone, { maxRedirects: 0 });
    expect(res.status(), `410 for ${gone}`).toBe(410);
  }
});

test("/api/compass sets a secure anonymous cookie (HttpOnly, SameSite=Lax, Path=/, Max-Age)", async ({
  request,
}) => {
  // נתיב „השאלה החופשית” שוחזר. גם כשהעוזר כבוי (available:false) ה-GET
  // מחזיר 200 וקובע מזהה אנונימי מאובטח — בלי לשלוח את נוסח השאלה לשום מקום.
  const res = await request.get("/api/compass");
  expect(res.status()).toBe(200);
  const setCookies = res
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value)
    .filter((v) => v.startsWith("compass_uid="));
  expect(setCookies.length).toBeGreaterThan(0);
  const cookie = setCookies[0];
  expect(cookie).toMatch(/HttpOnly/i);
  expect(cookie).toMatch(/SameSite=Lax/i);
  expect(cookie).toMatch(/Path=\//i);
  expect(cookie).toMatch(/Max-Age=\d+/i);
});

test("/compass is an active deterministic closed route (closed choices, no free text)", async ({
  page,
}) => {
  const res = await page.goto("/compass", { waitUntil: "networkidle" });
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("שאל את הספר");
  // מסך פתיחה: בחירת תחנה — בחירות סגורות (radiogroup), ללא טקסט חופשי.
  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();
  await expect(page.getByRole("radiogroup")).toHaveCount(1);
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("/book is a real page (not a redirect) with the deep-dive content", async ({ page }) => {
  const res = await page.goto("/book", { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("מה יש בספר, ואיך הוא עובד");
  // ששת הכלים המעשיים מופיעים כאן (פעם אחת, בבנטו האינטראקטיבי), ולא נשארו בבית.
  await expect(page.getByRole("heading", { name: "כלים מעשיים מתוך הספר" })).toBeVisible();
  await expect(page.locator("#tools button.tool-lux-card")).toHaveCount(6);
});

test("home page has the canonical title and unique social metadata", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("מדייטים לאהבה: ספר מעשי לדייטינג ולזוגיות | צחי חן");
  // WebSite + Book structured data present. לפני פתיחת המכירה — אין Product/Offer.
  const ldTypes = await page.$$eval('script[type="application/ld+json"]', (els) =>
    els.map((e) => JSON.parse(e.textContent || "{}")["@type"])
  );
  expect(ldTypes).toContain("WebSite");
  expect(ldTypes).toContain("Book");
  expect(ldTypes, "אין Product לפני פתיחת המכירה").not.toContain("Product");
});

test("station pages emit accurate structured data (WebPage + BreadcrumbList, not Article, no duplicates)", async ({
  page,
}) => {
  for (const path of [
    "/before-relationship",
    "/building-relationship",
    "/inside-relationship",
    "/after-breakup",
    "/starting-again",
  ]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const types = await page.$$eval('script[type="application/ld+json"]', (els) =>
      els.map((e) => JSON.parse(e.textContent || "{}")["@type"]),
    );
    expect(types, `${path}: WebPage`).toContain("WebPage");
    expect(types, `${path}: BreadcrumbList`).toContain("BreadcrumbList");
    // עמודי-תחנה אינם מאמרים מתוארכים — אין Article, ואין Product (טרום-מכירה).
    expect(types, `${path}: no Article`).not.toContain("Article");
    expect(types, `${path}: no Product`).not.toContain("Product");
    // בלי כפילויות סכימה (בדיוק WebPage אחד ו-BreadcrumbList אחד).
    expect(types.filter((t) => t === "WebPage"), `${path}: single WebPage`).toHaveLength(1);
    expect(
      types.filter((t) => t === "BreadcrumbList"),
      `${path}: single BreadcrumbList`,
    ).toHaveLength(1);
  }
});

test("sitemap, robots and manifest are served correctly", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap");

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const manifestJson = await manifest.json();
  expect(manifestJson.dir).toBe("rtl");
});
