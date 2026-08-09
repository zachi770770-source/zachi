import { test, expect } from "./fixtures";

const MOBILE = { width: 390, height: 844 };

test.describe("Launch-readiness", () => {
  test("home Hero: one dominant sample action + one quiet secondary (ask the book)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const heroSection = page.locator("main section").first();

    // פעולה דומיננטית *יחידה*: „קראו טעימה מהספר · 2 דקות” → /preview.
    const dominant = heroSection.getByRole("link", {
      name: "קראו טעימה מהספר · 2 דקות",
    });
    await expect(dominant).toBeVisible();
    await expect(dominant).toHaveAttribute("href", "/preview");

    // אין שדה אימייל בשער, ואין כפתור רכישה מתחרה.
    await expect(heroSection.getByLabel("כתובת אימייל")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "לרכישת הספר" })).toHaveCount(0);

    // פעולה משנית יחידה ושקטה (קישור-טקסט): „שאל את הספר” → /compass.
    const ask = heroSection.getByRole("link", { name: "שאל את הספר" });
    await expect(ask).toHaveAttribute("href", "/compass");
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
    // הבאנר מזוין רק אחרי גלילה קלה במסכים נמוכים (כדי לא לכסות את ה-CTA).
    await page.evaluate(() => window.scrollTo(0, 200));
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
    await expect(page.getByRole("heading", { level: 1 })).toContainText("טעימה מהספר");
    await expect(reader).toContainText("בזמן שקראתם, על איזה קשר או דייט חשבתם?");
    await expect(page.getByRole("progressbar")).toBeVisible();

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

  test("hero: floating thoughts and the small refrain were removed; the dominant sample CTA stays active", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // פתקי „המחשבות” המרחפים הוסרו בכוונה (PHASE 13) — ה-Hero נקי מהם.
    await expect(page.locator(".hero-thoughts")).toHaveCount(0);
    await expect(page.locator(".hero-thought")).toHaveCount(0);
    // הפזמון הקטן שמתחת לכריכה הוסר גם הוא.
    await expect(page.locator(".hero-refrain")).toHaveCount(0);

    // פעולת ההמרה הראשית בשער — „קראו טעימה מהספר · 2 דקות” → /preview — פעילה.
    await expect(
      page.locator("main section").first().getByRole("link", {
        name: "קראו טעימה מהספר · 2 דקות",
      })
    ).toBeVisible();
  });

  test("home selector navigates to the journey page; the page is a personal landing with a contextual sample; floating ask engine still opens", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 3000 }).catch(() => {});

    // בבית: מנוע ההכוונה זמין כגלולה צפה — פותח את בורר התחנות.
    const pill = page.getByRole("button", { name: /שאל את הספר — / });
    await page.mouse.wheel(0, 200);
    await expect(pill).toHaveCSS("opacity", "1", { timeout: 4000 });
    await pill.click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "איפה אתם עכשיו?" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // הבחירה ב-Home היא ניווט לעמוד-המסע — לא פתיחת תוכן בבית.
    const path = page.locator("#path");
    await path.scrollIntoViewIfNeeded();
    await path.getByRole("link", { name: /אני מחפש/ }).click();
    await expect(page).toHaveURL(/\/before-relationship$/);

    // עמוד-המסע: כותרת אישית, פירורי-לחם, וטעימה מותאמת (Primary → contextual preview).
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "לפני שבוחרים מישהו, כדאי להבין איך אתם בוחרים.",
    );
    await expect(page.getByRole("navigation", { name: "פירורי לחם" })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "להמשך הקריאה" }).getByRole("link", { name: "קראו את הקטע שמתאים לשלב הזה" }),
    ).toHaveAttribute("href", "/preview?tool=fact-story-action&station=before-relationship");

    // „בחרו מסלול אחר” — קישור שקט חזרה לבורר, לא בורר-מלא בעמוד.
    await expect(page.getByRole("link", { name: /בחרו מסלול אחר/ })).toHaveAttribute(
      "href",
      "/#path",
    );
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
      "/building-relationship",
      "/after-breakup",
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
