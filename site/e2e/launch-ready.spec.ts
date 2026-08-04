import { test, expect } from "./fixtures";

const MOBILE = { width: 390, height: 844 };

test.describe("Launch-readiness", () => {
  test("home Hero: one dominant conversion action + light secondaries (sample, find my path)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const heroSection = page.locator("main section").first();

    // פעולת המרה דומיננטית אחת (כפתור הרשמה של הטופס הקומפקטי): „עדכנו אותי…”.
    const dominant = heroSection.getByRole("button", {
      name: "עדכנו אותי כשהספר יוצא",
    });
    await expect(dominant).toBeVisible();

    // אין כפתור רכישה דומיננטי מתחרה ב-Hero.
    await expect(page.getByRole("link", { name: "לרכישת הספר" })).toHaveCount(0);

    // פעולות משנה קלות (קישורי טקסט, לא כפתורים): „לקריאת טעימה מהספר” → /preview
    // (טריגר המעבר „כניסה לטעימה”, שמושך את כריכת השער אל עמוד ההצצה),
    // ו„למצוא את המסלול שלי” → /#where.
    const sample = heroSection.getByRole("link", { name: "לקריאת טעימה ללא הרשמה" });
    await expect(sample).toHaveAttribute("href", "/preview");
    const secondary = page.getByRole("link", { name: "למצוא את המסלול שלי" });
    await expect(secondary).toHaveAttribute("href", "/#where");
  });

  test("home newsletter section: the waitlist form still submits successfully", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const waitlist = page.locator("#waitlist");
    await waitlist.scrollIntoViewIfNeeded();
    await expect(waitlist).toBeVisible();
    await waitlist.getByLabel("כתובת אימייל").fill("dana@example.com");
    await waitlist.getByRole("checkbox").click();
    await waitlist.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText(/נרשמת בהצלחה/)).toBeVisible();
  });

  test("accessibility statement page exists and is linked from the footer", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: "הצהרת נגישות" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/accessibility$/);
    await expect(page.getByRole("heading", { level: 1, name: "הצהרת נגישות" })).toBeVisible();
    await expect(page.getByText(/התאמות שבוצעו/)).toBeVisible();
  });

  test("FAQ works and is crawlable without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/faq", { waitUntil: "domcontentloaded" });
    // סריקה: התשובות נמצאות ב-HTML גם כשהאקורדיון סגור.
    const html = await page.content();
    expect(html).toContain("שלוש תחנות בדרך לאהבה");
    expect(html).toContain("הספר אינו תחליף לטיפול");
    // נגישות ללא JS: <details> נטיבי נפתח בלחיצה גם בלי JavaScript.
    await page.getByText("למי הספר מתאים?", { exact: true }).click();
    await expect(page.getByText(/שלוש תחנות בדרך לאהבה/)).toBeVisible();
    await context.close();
  });

  test("author page: real photo, personal header, sample CTA (pre-launch)", async ({ page }) => {
    await page.goto("/author", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("למה כתבתי");
    const img = page.getByAltText("צחי חן, מחבר הספר מדייטים לאהבה");
    await expect(img).toBeVisible();
    const currentSrc = await img.evaluate((el) => (el as HTMLImageElement).currentSrc);
    expect(currentSrc).toMatch(/zachi-chen-\d+\.(avif|webp|jpg)/);
    // פעולה מרכזית אחת בעמוד המחבר: לקריאת טעימה (לא הרשמה, שמרוכזת בסוף הטעימה).
    const cta = page.getByRole("link", { name: "לקריאת טעימה מהספר" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/preview");
  });

  test("cookie banner reserves space and does not cover the footer", async ({ page }) => {
    await page.goto("/author", { waitUntil: "networkidle" });
    const banner = page.getByRole("region", { name: "הסכמה לשימוש בעוגיות" });
    await expect(banner).toBeVisible();
    // הגוף שומר מקום בתחתית בגובה הבאנר בפועל, כך שהבאנר לא מכסה תוכן/פוטר.
    const pad = await page.evaluate(
      () => parseFloat(getComputedStyle(document.body).paddingBottom) || 0
    );
    const h = (await banner.boundingBox())!.height;
    expect(pad).toBeGreaterThan(0);
    expect(Math.abs(pad - h)).toBeLessThanOrEqual(4);
  });

  test("sample reader: accessible text, font size + theme persist, progress, back", async ({
    page,
  }) => {
    await page.goto("/preview", { waitUntil: "networkidle" });
    const reader = page.locator(".sample-reader");
    await expect(reader).toBeVisible();

    // תוכן HTML נגיש (לא תמונות): כותרת, קטע וסיום קיימים כטקסט.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("כמה עמודים");
    await expect(reader).toContainText("בזמן שקראתם, על איזה קשר או דייט חשבתם?");
    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByText(/דק׳ קריאה/)).toBeVisible();

    // הגדלת כתב → שינוי המשתנה --reader-fs.
    const scale0 = await reader.evaluate((el) => getComputedStyle(el).getPropertyValue("--reader-fs"));
    await page.getByRole("button", { name: "הגדלת גודל הכתב" }).click();
    const scale1 = await reader.evaluate((el) => getComputedStyle(el).getPropertyValue("--reader-fs"));
    expect(Number(scale1)).toBeGreaterThan(Number(scale0));

    // מצב כהה — משפיע על אזור הקריאה בלבד, ונשמר מקומית.
    await page.getByRole("button", { name: "מצב קריאה כהה" }).click();
    await expect(reader).toHaveAttribute("data-reader-theme", "dark");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".sample-reader")).toHaveAttribute("data-reader-theme", "dark");

    // כפתור חזרה ברור.
    await expect(reader.getByRole("link", { name: /חזרה לעמוד הבית/ })).toBeVisible();
  });

  test("book map: three parts, each with a chapter, an examining question and a line", async ({
    page,
  }) => {
    await page.goto("/preview", { waitUntil: "networkidle" });
    const stations = page.locator(".book-map__station");
    await expect(stations).toHaveCount(3);
    await expect(stations.nth(0)).toContainText("מזהים את הרעש");
    await expect(stations.nth(1)).toContainText("עוברים את השער");
    await expect(stations.nth(2)).toContainText("מתחילים לבנות");
    await expect(page.locator(".book-map__examines").first()).toBeVisible();
  });

  test("author page: single author story, no audio block or duplication while file is missing", async ({
    page,
  }) => {
    await page.goto("/author", { waitUntil: "networkidle" });
    // סיפור המחבר מופיע פעם אחת בלבד — אין בלוק „תמלול” כפול.
    await expect(page.getByText(/גם כשאנחנו מכירים את עצמנו היטב/)).toHaveCount(1);
    // אין קובץ שמע → אין רכיב שמע, אין כותרת שנייה, אין תמלול ואין placeholder.
    await expect(page.locator("audio")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "למה כתבתי את הספר הזה" })).toHaveCount(0);
    await expect(page.locator("#author-audio-transcript")).toHaveCount(0);
    await expect(page.getByText(/תתווסף/)).toHaveCount(0);
  });

  test("hero: floating thoughts and the small refrain were removed; message lives in the Sage Thesis band; CTA stays active", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // פתקי „המחשבות” המרחפים הוסרו בכוונה (PHASE 13) — ה-Hero נקי מהם.
    await expect(page.locator(".hero-thoughts")).toHaveCount(0);
    await expect(page.locator(".hero-thought")).toHaveCount(0);

    // הפזמון הקטן שמתחת לכריכה הוסר — המסר „חיפוש→בנייה” נמסר פעם אחת,
    // נחרצות, בבאנד המרווה (סקשן התזה).
    await expect(page.locator(".hero-refrain")).toHaveCount(0);
    const thesis = page.locator("#thesis-heading");
    await expect(thesis).toContainText("דייטינג הוא חיפוש.");
    await expect(thesis).toContainText("אהבה היא בנייה.");

    // פעולת ההמרה הראשית (טופס ההרשמה הקומפקטי, „עדכנו אותי…”) נשארת פעילה ב-Hero.
    await expect(
      page.locator("main section").first().getByRole("button", {
        name: "עדכנו אותי כשהספר יוצא",
      })
    ).toBeVisible();
  });

  test("stations: home experience links to dedicated pages, which cross-link and CTA to the sample", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // חוויית התחנות היחידה (#where): בחירת „לפני קשר” חושפת קישור לדף הייעודי.
    const where = page.locator("#where");
    await where.scrollIntoViewIfNeeded();
    await where.getByText("לפני קשר", { exact: true }).click();
    await where
      .getByRole("link", { name: /לתחנה המלאה: לפני קשר/ })
      .click();
    await expect(page).toHaveURL(/\/before-relationship$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("לפני קשר");

    // פירורי לחם נגישים + פעולה מרכזית: לקריאת הטעימה שמתאימה לי (טרום-השקה).
    await expect(page.getByRole("navigation", { name: "פירורי לחם" })).toBeVisible();
    const cta = page.getByRole("link", { name: "לקריאת הטעימה שמתאימה לי" });
    await expect(cta).toHaveAttribute("href", "/preview");

    // מעבר לתחנה אחרת דרך הקישורים בתחתית.
    await page.getByRole("link", { name: /בתוך קשר/ }).first().click();
    await expect(page).toHaveURL(/\/inside-relationship$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("בתוך קשר");
  });

  test("waitlist: dedicated page saves a real signup", async ({ page }) => {
    await page.goto("/waitlist", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name: "קבלו עדכון כשהספר יוצא" })).toBeVisible();
    await page.getByLabel("כתובת אימייל").fill("station-signup@example.com");
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }).click();
    await expect(page.getByText(/נרשמת בהצלחה/)).toBeVisible();
  });

  test("RTL + no horizontal overflow on home and key pages (mobile)", async ({ browser }) => {
    const context = await browser.newContext({ viewport: MOBILE });
    const page = await context.newPage();
    for (const path of [
      "/",
      "/before-relationship",
      "/starting-again",
      "/inside-relationship",
      "/waitlist",
      "/author",
      "/faq",
      "/accessibility",
      "/checkout",
    ]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });
});
