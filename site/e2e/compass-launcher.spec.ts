import { test, expect } from "@playwright/test";

/**
 * „שאל את הספר” — הבועה הצפה חייבת להיות נוכחת וברורה בשני המכשירים, ולהופיע מהר:
 * גם בלי גלילה כלל (טיימר-גיבוי קצר) וגם אחרי גלילה קטנה. במובייל היא מוסתרת
 * כל עוד באנר העוגיות פתוח — ולכן סוגרים אותו קודם. החלונית מיושרת לכיתוב
 * „שאל את הספר” עם כותרת-משנה של 3 שאלות — בלי שום ניסוח של צ׳אט חופשי או AI.
 */

// הגלולה הצפה נבדלת מכפתור „שאל את הספר” שבמקטע ה-#where (AskInvite): שם-הנגישות
// שלה הוא ה-aria-label המלא („מה הספר אומר על המצב שלי?, כמה שאלות…”), בעוד כפתור
// ה-#where הוא „שאל את הספר” בדיוק. מסננים לפי הכיתוב המלא כדי למקד רק את הגלולה.
const compass = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /מה הספר אומר על המצב שלי\?, / });

// הגלולה נשארת גלויה גם כשבאנר-העוגיות פתוח (מורמת מעליו) — הבדיקות למטה
// מוודאות זאת. סגירת הבאנר משמשת לבדיקת המצב התחתון הרגיל.
async function dismissCookies(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: "אישור הכל" });
  await accept.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  if (await accept.count()) {
    await accept.first().click().catch(() => {});
    await page
      .waitForFunction(() => !document.body.hasAttribute("data-cookie-banner"))
      .catch(() => {});
  }
}

test.describe("compass floating bubble", () => {
  test("desktop: bubble is present immediately on load, then opens the drawer", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);
    // נוכחת מיד עם הטעינה — בלי גלילה וללא המתנה לטיימר. opacity=1 מיידית.
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 1500 });
    await compass(page).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // כותרת + כותרת-משנה מיושרות ל„מה הספר אומר על המצב שלי?” (כמה שאלות, לא צ׳אט).
    await expect(dialog.getByText("מה הספר אומר על המצב שלי?")).toBeVisible();
    await expect(
      dialog.getByText(/כמה שאלות קצרות/)
    ).toBeVisible();
    // אין ניסוח שמרמז על צ׳אט חופשי / שיחה עם AI.
    await expect(dialog.getByText(/צ.אט|בינה מלאכות|שיחה עם|AI/)).toHaveCount(0);
    // מנוע ההכוונה הסגור עצמו נשאר (מסך בחירת התחנה).
    await expect(dialog.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();
  });

  test("desktop: bubble also reveals after a small scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookies(page);
    await page.mouse.wheel(0, 250);
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
  });

  test("mobile: bubble reveals after scrolling past the first fold (kept off the hero)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookies(page);
    // במובייל הגלולה מוסתרת מעל ה-Hero (קיפול-ראשון) כדי לא לכסות תוכן: שקופה,
    // לא-לחיצה, ומוצאת מעץ-הנגישות (aria-hidden) — ולכן getByRole אינו מאתר אותה.
    // בודקים את מצב-ההסתרה דרך סלקטור-CSS ישיר.
    const pillCss = page.locator("button.compass-pill");
    await expect(pillCss).toHaveCSS("opacity", "0");
    await expect(pillCss).toHaveCSS("pointer-events", "none");
    await expect(compass(page)).toHaveCount(0); // aria-hidden ⇒ מחוץ לעץ-הנגישות
    // נחשפת אחרי גלילה מעבר לקיפול — וחוזרת לעץ-הנגישות (getByRole מאתר). גוללים
    // אל מעבר למקטע-השיחה (#path): שם הגלולה מוסתרת בכוונה, ולכן בודקים את
    // החשיפה במקום פנוי מ-#path (תחתית העמוד).
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    // יעד מגע נגיש (≥44px).
    const box = await compass(page).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  const banner = (page: import("@playwright/test").Page) =>
    page.getByRole("region", { name: "הסכמה לשימוש בעוגיות" });

  test("desktop: bubble stays visible + clickable WHILE the cookie banner is open (no overlap)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    // לא סוגרים את הבאנר — הוא מופיע בטעינה בדסקטופ.
    await expect(banner(page)).toBeVisible();
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    // אין חפיפה: הגלולה כולה מעל ראש הבאנר.
    const b = await compass(page).boundingBox();
    const c = await banner(page).boundingBox();
    expect(c!.y - (b!.y + b!.height)).toBeGreaterThan(0);
    // ולחיצה עובדת גם כשהבאנר פתוח → החלונית נפתחת.
    await compass(page).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("mobile: bubble stays visible + clickable WHILE the cookie banner is open (no overlap)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    // הבאנר מזוין אחרי גלילה. גוללים אל מעבר למקטע-השיחה (#path) — שם הגלולה
    // מוסתרת בכוונה — כדי לבדוק את הדו-קיום שלה עם הבאנר במקום פנוי מ-#path.
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(banner(page)).toBeVisible();
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    const b = await compass(page).boundingBox();
    const c = await banner(page).boundingBox();
    expect(c!.y - (b!.y + b!.height)).toBeGreaterThan(0);
    await compass(page).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  // דרישת-אישור מפורשת: כשהבאנר פתוח הגלולה נשארת גלויה, מעליו עם מרווח ברור,
  // שומרת על aria-label וניתנת למיקוד-מקלדת ולהפעלה — בשני המכשירים.
  for (const vp of [
    { label: "desktop", width: 1440, height: 900, scroll: 0 },
    { label: "mobile", width: 390, height: 844, scroll: 700 },
  ]) {
    test(`${vp.label}: pill stays visible+clickable while cookie banner is open, clear gap, aria-label, keyboard focus`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "networkidle" });
      if (vp.scroll) await page.evaluate((y) => window.scrollTo(0, y), vp.scroll);
      // במובייל הגלולה מוסתרת בכוונה כל עוד מקטע-השיחה (#path) במסך — גוללים אל
      // מעברו (תחתית העמוד) כדי לבדוק את הדו-קיום עם הבאנר במקום פנוי ממנו.
      if (vp.label === "mobile") {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }

      // הבאנר פתוח (לא סוגרים אותו).
      await expect(banner(page)).toBeVisible();
      const pill = compass(page);
      // גלויה (opacity=1), לא מוסתרת.
      await expect(pill).toHaveCSS("opacity", "1", { timeout: 4000 });
      await expect(pill).toHaveCSS("pointer-events", "auto");

      // מרווח ברור מעל הבאנר — בלי חפיפה, ובטווח מכובד (≥10px).
      const b = (await pill.boundingBox())!;
      const c = (await banner(page).boundingBox())!;
      const gap = c.y - (b.y + b.height);
      expect(gap).toBeGreaterThanOrEqual(10);

      // aria-label נשמר (זהות נגישה יציבה).
      await expect(pill).toHaveAttribute(
        "aria-label",
        /מה הספר אומר על המצב שלי\?, כמה שאלות/,
      );

      // מיקוד-מקלדת עובד, ו-Enter פותח את החלונית — גם כשהבאנר פתוח.
      await pill.focus();
      await expect(pill).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
    });
  }
});

test.describe("compass bubble is site-wide and context-aware", () => {
  // הבועה מלווה את הקורא בכל העמודים המרכזיים (מותקנת ב-layout), חוץ מ-/compass
  // עצמו (שם העמוד *הוא* המנוע).
  for (const path of ["/book", "/preview", "/before-relationship", "/author"]) {
    test(`bubble is present on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      await dismissCookies(page);
      await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    });
  }

  test("bubble is NOT rendered inside /compass itself", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/compass", { waitUntil: "networkidle" });
    await dismissCookies(page);
    await expect(compass(page)).toHaveCount(0);
  });

  test("on a journey page the bubble continues from the known station (skips „where are you?”)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    // /before-relationship → תחנת „dating”. פתיחת הבועה צריכה לדלג על שאלת התחנה
    // ולפתוח ישר בשלב הדילמה — כי ההקשר כבר ידוע מהנתיב.
    await page.goto("/before-relationship", { waitUntil: "networkidle" });
    await dismissCookies(page);
    await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
    await compass(page).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // מדלג על „איפה אתם עכשיו?” ומתחיל בדילמה.
    await expect(
      dialog.getByRole("heading", { name: "איפה אתם עכשיו?" }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("heading", { name: "מה הכי מעסיק אתכם כרגע?" }),
    ).toBeVisible();
  });
});

test.describe("compass drawer: „לקרוא את הקטע המתאים בספר” navigates to the sample and closes the overlay", () => {
  // רגרסיה: מתוך ה-drawer (ה-Dialog של הבועה) לחיצה על ה-CTA לקטע היא ניווט
  // צד-לקוח דרך <Link>. ה-CompassLauncher חי ב-layout המתמיד ולכן ה-Dialog נשאר
  // פתוח וה-Overlay (fixed inset-0) כיסה את עמוד /preview — המשתמש „לא הגיע”
  // לקטע. הבדיקה מוודאת שהניווט מצליח *וגם* שה-drawer נסגר, בשני המכשירים.
  for (const vp of [
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobile", width: 390, height: 844 },
  ]) {
    test(`${vp.label}: clicking the sample CTA reaches /preview with the right tool+station and dismisses the drawer`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      // עמוד-מסלול „לפני קשר” → תחנת „dating” ידועה מהנתיב, כך שהבועה נפתחת
      // ישר בשלב הדילמה.
      await page.goto("/before-relationship", { waitUntil: "networkidle" });
      await dismissCookies(page);

      // במובייל הגלולה נחשפת רק מעבר לקיפול-הראשון — גוללים לפני שמפעילים אותה.
      if (vp.width < 768) await page.evaluate(() => window.scrollTo(0, 700));
      await expect(compass(page)).toHaveCSS("opacity", "1", { timeout: 4000 });
      await compass(page).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // דילמה ללא שלב-הקשר → תוצאה מיידית (עם כלי, ולכן ה-CTA לקטע מוצג).
      await dialog
        .getByRole("radio", { name: /שחוק.* מאפליקציות ומדייטים/ })
        .click();
      await expect(dialog.getByRole("article")).toBeVisible();

      const sampleCta = dialog.getByRole("link", {
        name: "לקרוא את הקטע המתאים בספר",
      });
      await expect(sampleCta).toBeVisible();
      await sampleCta.click();

      // 1. הגענו לקטע הנכון: /preview עם הכלי והתחנה שנגזרו מהתשובה.
      await page.waitForURL(/\/preview\?/);
      const url = new URL(page.url());
      expect(url.pathname).toBe("/preview");
      expect(url.searchParams.get("tool")).toBe("boundary-ladder");
      expect(url.searchParams.get("station")).toBe("before-relationship");

      // 2. ה-drawer נסגר וה-Overlay אינו מכסה את העמוד — הקטע נגיש בפועל.
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(
        page.getByRole("progressbar", { name: /התקדמות|קריאה/ }).first(),
      ).toBeVisible();
      // שורת-ההקשר האישית מופיעה רק כשכלי+תחנה תקפים — אישור שהקטע המותאם נטען.
      await expect(page.locator(".reader-context")).toBeVisible();
    });
  }
});
