import { test, expect } from "./fixtures";

/**
 * „שאל את הספר” — בדיקות-שמירה של ביקורת-העומק: מהלך על כל תחנה עד תוצאה עם
 * קונסולה נקייה, פוקוס על הכותרת, בלי גלילה אופקית ובלי שפה טיפולית/מאבחנת;
 * וּודא ששכבת פרק ב' (התאמה) נגישה בכל אחת משלוש תחנות-הקשר.
 */

async function walk(
  page: import("@playwright/test").Page,
  station: RegExp,
  dilemma: RegExp,
) {
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("radio", { name: station }).click();
  await page.getByRole("radio", { name: dilemma }).click();
  // אם יש שאלת-הקשר — בוחרים את האפשרות הראשונה (לא-בטיחות/ללא-מורכבות).
  const ctxHeading = page.getByRole("heading", {
    name: /האם משהו מאלה|מרגיש בבית כרגע/,
  });
  if (await ctxHeading.count()) {
    await page.getByRole("radio").first().click();
  }
  await page.getByRole("article").waitFor();
}

test("audit: 4 stations reach a result — clean console, focus, no overflow, no therapy-speak", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const cases: [RegExp, RegExp][] = [
    [/חיפוש ודייטים/, /מתקשה להתחיל/],
    [/בניית קשר/, /פער בין המילים/],
    [/קשר קיים/, /נוצרו ריחוק ושגרה/],
    [/אחרי פרידה/, /רוצה לחזור בעיקר בגלל בדידות/],
  ];

  for (const [st, dl] of cases) {
    await walk(page, st, dl);
    const article = page.getByRole("article");
    // פוקוס על כותרת התוצאה.
    await expect(article.getByRole("heading")).toBeFocused();
    // CTA ראשי ברור (טעימה) + רשימת המתנה.
    await expect(article.locator('a[href^="/preview?tool="]')).toBeVisible();
    await expect(article.locator('a[href="/waitlist"]')).toBeVisible();
    // שפה לא-טיפולית/מאבחנת בגוף התוצאה, בלי אחוזי-ביטחון. פסקת ההבהרה
    // („לא אבחון או ייעוץ”) *שוללת* אבחון בכוונה — ולכן מוחרגת מהבדיקה.
    const therapyLeak = await article.evaluate((el) => {
      const RE =
        /(אבחון|טיפול|פסיכולוג|מטופל|תסמונת|הפרעה|דיאגנוז|תשובה נכונה|המערכת יודעת|מצאנו את הבעיה)/;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("p").forEach((p) => {
        if (/מכירים את עצמכם/.test(p.textContent || "")) p.remove();
      });
      return RE.test(clone.textContent || "");
    });
    expect(therapyLeak).toBe(false);
    await expect(article.getByText(/%/)).toHaveCount(0);
    // אין גלילה אופקית.
    const of = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(of).toBeLessThanOrEqual(0);
  }
  expect(errors, errors.join("\n")).toEqual([]);
});

test("audit: „אחרי פרידה” מסמנת במפורש שהיא תחנת-מעבר (לא דוחפת לכיוון)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await walk(page, /אחרי פרידה/, /רוצה לחזור בעיקר בגלל בדידות/);
  const article = page.getByRole("article");
  await expect(article.getByText(/זו תחנת מעבר/)).toBeVisible();
});

test("audit: איור מאושר מוצג בתוצאת התחנה — עם alt תיאורי, ולא בתחנה ללא איור", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  // „אחרי פרידה” — האיור מופיע עם ה-alt המאושר (לא ריק).
  await walk(page, /אחרי פרידה/, /רוצה לחזור בעיקר בגלל בדידות/);
  await expect(
    page.getByRole("article").getByRole("img", {
      name: /אישה עוצרת בין קשר שנותר מאחור/,
    }).first(),
  ).toBeVisible();

  // „חיפוש ודייטים” — אין איור מאושר, ולכן אין תמונה בתוצאה.
  await walk(page, /חיפוש ודייטים/, /מתקשה להתחיל/);
  await expect(page.getByRole("article").getByRole("img")).toHaveCount(0);
});

test("audit: שכבת פרק ב' (התאמה) נגישה בכל אחת משלוש תחנות-הקשר", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const c2Cases: [RegExp, RegExp][] = [
    [/חיפוש ודייטים/, /פוסל.*מהר מדי/],
    [/בניית קשר/, /אחד מאיתנו מתקדם/],
    [/קשר קיים/, /נוצרו ריחוק ושגרה/],
  ];
  for (const [st, dl] of c2Cases) {
    await page.goto("/compass", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("radio", { name: st }).click();
    await page.getByRole("radio", { name: dl }).click();
    // חייבת להופיע שאלת-הקשר של פרק ב'.
    await expect(
      page.getByText("האם משהו מאלה חלק מהתמונה שלכם עכשיו?"),
    ).toBeVisible();
    await page
      .getByRole("radio", { name: /ילדים, גרוש|משפחה משולבת/ })
      .first()
      .click();
    await expect(
      page.getByRole("article").getByText("התאמה למצב שלכם"),
    ).toBeVisible();
  }
});
