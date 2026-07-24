import { test, expect, type Page } from "@playwright/test";

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
  "/preview",
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

test("FAQ accordion opens an answer", async ({ page }) => {
  await page.goto("/faq", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "למי הספר מתאים?" }).click();
  await expect(page.getByText(/לכל מי שנמצא בתהליך/)).toBeVisible();
});

test("cookie consent: accept all hides the banner without crashing the app", async ({
  page,
}) => {
  const errors = trackErrors(page);
  await page.goto("/", { waitUntil: "networkidle" });

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

test("sticky purchase bar appears after scrolling past the hero, dismisses, and is hidden on /checkout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור הכל" }).click();

  const bar = page.getByRole("region", { name: "רכישה מהירה" });
  await expect(bar).toBeHidden();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await expect(bar).toBeVisible();

  await page.getByRole("button", { name: "סגירת פס הרכישה" }).click();
  await expect(bar).toBeHidden();

  await page.goto("/checkout", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(bar).toBeHidden();
});

test("contact form submits successfully", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "networkidle" });
  await page.getByLabel("שם").fill("בודק אוטומטי");
  await page.getByLabel("אימייל או טלפון").fill("tester@example.com");
  await page.getByLabel("נושא").fill("בדיקה");
  await page.getByLabel("הודעה").fill("זוהי הודעת בדיקה אוטומטית לצורך אימות הטופס.");
  await page.getByRole("button", { name: "שליחת הודעה" }).click();
  await expect(page.getByText("ההודעה נשלחה בהצלחה")).toBeVisible();
});

test("newsletter form submits successfully", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByLabel("שם פרטי").fill("בודקת");
  await page.getByLabel("אימייל", { exact: false }).first().fill("newslettertest@example.com");
  await page.getByLabel(/אני מסכים\/ה לקבל את התוכן/).click();
  await page.getByRole("button", { name: "שליחת הטעימה החינמית" }).click();
  await expect(page.getByText("נרשמתם בהצלחה")).toBeVisible();
});

test("digital checkout asks only name + email (no quantity, no address)", async ({
  page,
}) => {
  await page.goto("/checkout?format=digital", { waitUntil: "networkidle" });

  // אין בורר כמות ואין שדות משלוח במהדורה דיגיטלית.
  await expect(page.getByRole("radio", { name: /עותקים/ })).toHaveCount(0);
  await expect(page.getByLabel("יישוב")).toHaveCount(0);
  await expect(page.getByLabel("רחוב")).toHaveCount(0);

  // רק שם ואימייל.
  await expect(page.getByLabel("שם מלא")).toBeVisible();
  await expect(page.getByLabel(/אימייל/)).toBeVisible();
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
