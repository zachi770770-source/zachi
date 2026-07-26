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
  "/before-relationship",
  "/starting-again",
  "/inside-relationship",
  "/waitlist",
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
  await page.getByRole("button", { name: "אישור הכל" }).click();

  const bar = page.getByRole("region", { name: "רכישה מהירה" });
  await expect(bar).toBeHidden();

  // גם לאחר גלילה מעבר ל-Hero — אין פס רכישה במצב טרום-השקה.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
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

test("waitlist form submits successfully", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const waitlist = page.locator("#waitlist");
  await waitlist.getByLabel("כתובת אימייל").fill("waitlisttest@example.com");
  await waitlist.getByRole("checkbox").click();
  await waitlist.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
  await expect(page.getByText(/נרשמת בהצלחה/)).toBeVisible();
});

test("checkout is closed during pre-launch (no form, no payment)", async ({
  page,
}) => {
  await page.goto("/checkout?format=digital", { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { name: "המכירה עדיין לא נפתחה" })
  ).toBeVisible();
  // אין טופס וללא הדגמת תשלום.
  await expect(page.getByLabel("שם מלא")).toHaveCount(0);
  await expect(page.getByLabel(/אימייל/)).toHaveCount(0);
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
