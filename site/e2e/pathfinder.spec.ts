import { test, expect, type Locator, type Page } from "./fixtures";

/**
 * כיסוי התנהגותי מלא ל-Path Finder אחרי ה-PASS:
 *  • כל 27 צירופי Q1×Q2×Q3 מחזירים תוצאה עם פעולה ראשית.
 *  • תשובת Q3 קובעת את ה-CTA הראשי *ואת יעדו* (טעימה מותאמת / כלי / תחנה).
 *  • query לא חוקי ב-/preview חוזר בבטחה לטעימה הכללית; query תקין מוסיף הקשר.
 *  • deep-link, Back ו-modifier-click אינם נשברים.
 *  • תוכן התשובות לעולם אינו נשלח לשרת/אנליטיקה.
 *
 * (מיפוי התשובה→כלי ל-27 הצירופים + נגישות כל ששת הכלים מוכחים גם ביחידה:
 *  src/lib/pathfinder/toolMapping.test.ts.)
 */

/**
 * לוחצים על אלמנט אחרי שמעגנים אותו למרכז התצוגה. ה-header הדביק (גובה ~76px)
 * מכסה את ראש התצוגה, ו-Playwright מגלגל יעד לראש כברירת מחדל — כך שקליק על
 * רדיו/קישור שנוחת מתחת ל-header משתבש. עיגון למרכז מבטיח שנקודת-הפגיעה לעולם
 * אינה תחת ה-header.
 */
async function pick(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
  await locator.click();
}

async function openWhere(page: Page) {
  // בדיקות לוגיקה (לא ויזואליות): reduced-motion מציג תוצאה/כרטיסים מיד במצבם
  // הסופי — בלי אנימציית-כניסה שמעכבת „element is not stable”.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();
  // סוגרים את באנר-העוגיות פעם אחת: אחרת הוא נחשף/נסגר עם כל גלילת-עיגון ומשנה
  // padding-bottom של ה-body — מה שמזיז את התוצאה בלי הרף („element is not stable”).
  await page
    .getByRole("button", { name: "אישור הכל" })
    .click({ timeout: 3000 })
    .catch(() => {});
  return where;
}

test("all 27 Q1×Q2×Q3 combinations render a result with a primary action", async ({ page }) => {
  // 27 מעברים מלאים (בחירה→תוצאה→התחלה-מחדש) חורגים מברירת-המחדל של 30 שניות.
  test.setTimeout(120_000);
  const where = await openWhere(page);
  let seen = 0;
  for (let q1 = 0; q1 < 3; q1++) {
    for (let q2 = 0; q2 < 3; q2++) {
      for (let q3 = 0; q3 < 3; q3++) {
        // כל שאלה היא radiogroup נטיבי (אחד בכל רגע); בוחרים לפי אינדקס, עם
        // עיגון על מונה ההתקדמות כדי למנוע מרוץ מול המעבר בין השאלות.
        await pick(where.getByRole("radiogroup").getByRole("radio").nth(q1));
        await expect(where.getByText("שאלה 2/3")).toBeVisible();
        await pick(where.getByRole("radiogroup").getByRole("radio").nth(q2));
        await expect(where.getByText("שאלה 3/3")).toBeVisible();
        await pick(where.getByRole("radiogroup").getByRole("radio").nth(q3));

        const article = where.locator("article");
        await expect(article).toBeVisible();
        await expect(article.getByText(/נקודת הפתיחה שלכם/)).toBeVisible();
        // פעולה ראשית אחת (כפתור בולט) — הקישור הראשון בתוך התוצאה.
        const primary = article.locator("a").first();
        await expect(primary).toBeVisible();
        expect(await primary.getAttribute("href")).toBeTruthy();

        await pick(where.getByRole("button", { name: "להתחיל מחדש" }));
        await expect(where.getByText("שאלה 1/3")).toBeVisible();
        seen++;
      }
    }
  }
  expect(seen).toBe(27);
});

test("Q3 determines the primary CTA and its real destination (same Q1+Q2)", async ({ page }) => {
  // Q1 = „אני מחפש/ת קשר” (before-relationship), Q2 index 0 → הכלי gate-questions.
  const cases: Array<{ q3: RegExp; href: string }> = [
    { q3: /קטע שמתאים לי/, href: "/preview?tool=gate-questions&station=before-relationship" },
    { q3: /כלי מעשי שמתאים לי/, href: "/book#tool-gate-questions" },
    { q3: /להבין את התחנה שלי/, href: "/before-relationship" },
  ];
  const hrefs = new Set<string>();
  for (const c of cases) {
    const where = await openWhere(page);
    await pick(where.getByRole("radio", { name: "אני מחפש/ת קשר" }));
    await pick(where.getByRole("radio", { name: /נועל.*מסקנה/ }));
    await pick(where.getByRole("radio", { name: c.q3 }));

    const primary = where.locator("article a").first();
    await expect(primary).toHaveAttribute("href", c.href);
    hrefs.add(c.href);
  }
  // שלושת יעדי ה-CTA הראשי שונים זה מזה — הבחירה ב-Q3 באמת מחליפה יעד.
  expect(hrefs.size).toBe(3);
});

test("/preview: invalid tool/station query falls back safely to the general sample", async ({
  page,
}) => {
  // query לא חוקי — אין שורת-הקשר אישית, אך הטעימה הכללית נטענת רגיל.
  await page.goto("/preview?tool=bogus&station=nope", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("טעימה מהספר");
  await expect(page.locator(".reader-context")).toHaveCount(0);

  // query תקין — מתווספת שורת-הקשר, והתוכן נשאר אותה טעימה מאושרת.
  await page.goto("/preview?tool=gate-questions&station=before-relationship", {
    waitUntil: "networkidle",
  });
  await expect(page.locator(".reader-context")).toHaveCount(1);
  await expect(page.locator(".reader-context")).toContainText("בדיקת הקצב");
});

test("deep-link, Back and modifier-click do not break the sample destination", async ({ page }) => {
  const where = await openWhere(page);
  // Q3 = כלי → ה-CTA הראשי הוא deep-link לכרטיס הכלי ב-/book.
  await pick(where.getByRole("radio", { name: "אני מחפש/ת קשר" }));
  await pick(where.getByRole("radio", { name: /נועל.*מסקנה/ }));
  await pick(where.getByRole("radio", { name: /כלי מעשי שמתאים לי/ }));
  const primary = where.locator("article a").first();
  await expect(primary).toHaveAttribute("href", "/book#tool-gate-questions");

  // modifier-click (Ctrl) לא מנווט את העמוד הנוכחי (מיועד לכרטיסייה חדשה).
  await primary.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await primary.click({ modifiers: ["Control"] });
  await expect(page).toHaveURL(/\/$/);

  // ניווט רגיל: ה-deep-link פותח וממקד את כרטיס הכלי ב-/book.
  await primary.click();
  await expect(page).toHaveURL(/\/book#tool-gate-questions$/);
  await expect(page.locator("#tool-gate-questions")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#tool-detail-panel.is-open")).toBeVisible();

  // Back חוזר לבית עם השאלון קיים.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#where")).toBeVisible();
});

test("Path Finder never transmits answer content to the server or analytics", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push((r.postData() || "") + " " + r.url());
  });
  const where = await openWhere(page);
  await pick(where.getByRole("radio", { name: "אני מחפש/ת קשר" }));
  await pick(where.getByRole("radio", { name: /נועל.*מסקנה/ }));
  await pick(where.getByRole("radio", { name: /קטע שמתאים לי/ }));
  await expect(where.getByText(/נקודת הפתיחה שלכם/)).toBeVisible();
  const leaked = posts.filter((p) =>
    /מחפש|נועל|קטע שמתאים|before-relationship|gate-questions/.test(p),
  );
  expect(leaked, "answer/result content must never be transmitted").toEqual([]);
});
