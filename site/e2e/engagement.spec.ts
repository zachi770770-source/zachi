import { test, expect, type Locator, type Page } from "./fixtures";

/**
 * שדרוג המעורבות בטרום-השקה: טעימה ללא-חיכוך + בר-טעימה חכם.
 * הכללים: אין רכישה; הטעימה נגישה ללא הרשמה; הבר מופיע רק אחרי ה-Hero,
 * מפנה ל-/preview, נסגר ונזכר ל-session.
 */

/** פותח את חלונית „שאל את הספר” (drawer) מהגלולה הצפה בבית, יציב: reduced-motion
 *  (בלי אנימציית-כניסה) + סגירת באנר-העוגיות. מקטע ה-#where הוסר בקיצור העמוד —
 *  המנוע נשאר זמין רק כגלולה הצפה. מחזיר את ה-dialog. */
async function openAsk(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 3000 }).catch(() => {});
  // הגלולה הצפה נבדלת ב-aria-label המלא (עם מקף); נחשפת אחרי גלילה קלה.
  const pill = page.getByRole("button", { name: /מה הספר אומר על המצב שלי\?, / });
  await page.mouse.wheel(0, 200);
  await expect(pill).toHaveCSS("opacity", "1", { timeout: 4000 });
  await pill.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

/** לוחצים על רדיו/כפתור אחרי עיגון למרכז — ה-header הדביק מכסה את ראש התצוגה. */
async function pick(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await locator.click();
}

test("zero-friction: hero sample link opens /preview with no registration", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator("main section").first();
  const link = hero.getByRole("link", { name: "קראו טעימה מהספר · 2 דקות" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/preview");
  // ניווט ישיר — בלי אימייל, בלי מודאל.
  await link.click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("/preview is directly loadable and immediately readable (no signup wall)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  // תוכן הקריאה גלוי מיד; אין חסימת-הרשמה.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overlayForm = page.getByRole("dialog");
  await expect(overlayForm).toHaveCount(0);
});

test("smart sticky sample bar: appears after hero, links to /preview, dismissal persists for session", async ({
  browser,
}) => {
  // בר-הטעימה הוא פיצ׳ר של גלילה ארוכה: הוא מופיע כשה-Hero יוצא מהתצוגה ומתחבא
  // ליד טופסי הרשמה. בעיצוב-המובייל הדחוס (בית של ~2 מסכים) חלון-ההופעה נסגר —
  // הטופס תמיד סמוך ל-Hero — ולכן הבר אינו מופיע במובייל (וזה הרצוי: לא מתחרה
  // בגלולה הצפה). לכן מאמתים את התנהגות הבר בדסקטופ, שבו העמוד עדיין ארוך.
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 680 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  const bar = page.getByRole("complementary", { name: "בר הטעימה" });

  // לא מופיע כל עוד ה-Hero בתצוגה.
  await expect(bar).toBeHidden();

  // הרכיבים הצפים לא מתחרים על שטח התחתית: בזמן שבאנר-העוגיות פתוח בר-הטעימה
  // מוסתר. מאשרים עוגיות תחילה (גלילה מזיינת את הבאנר) כדי לסגור אותו, ואז
  // בר-הטעימה יכול להופיע אחרי ה-Hero.
  await page.evaluate(() => window.scrollTo(0, 220));
  await page.getByRole("button", { name: "אישור הכל" }).click();

  // אחרי גלילה מעבר ל-Hero — מופיע, מפנה לטעימה החינמית, ללא ניסוח רכישה.
  // גוללים אל מיד-אחרי ה-Hero (הבר מופיע כשה-Hero יוצא מהתצוגה), עדיין הרבה
  // לפני סצנת ה-s2b שמסתירה את הבר. גלילה מיידית ומגודרת-מיקום.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const hero = document.querySelector("main section");
    const y = (hero ? hero.getBoundingClientRect().bottom : 0) + window.scrollY + 40;
    window.scrollTo(0, y);
  });
  await expect(bar).toBeVisible();
  const cta = bar.getByRole("link", { name: /קראו טעימה מהספר/ });
  await expect(cta).toHaveAttribute("href", "/preview");
  await expect(bar.getByText(/לרכישה|buy|קנ/i)).toHaveCount(0);

  // סגירה — נעלם ונזכר ל-session (גם אחרי reload).
  await bar.getByRole("button", { name: "סגירת בר הטעימה" }).click();
  await expect(bar).toBeHidden();
  await page.reload({ waitUntil: "networkidle" });
  // גוללים אל מיד-אחרי ה-Hero (הבר מופיע כשה-Hero יוצא מהתצוגה), עדיין הרבה
  // לפני סצנת ה-s2b שמסתירה את הבר. גלילה מיידית ומגודרת-מיקום (לא אחוז שרירותי,
  // שהשתנה עם הארגון-מחדש של הבית).
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    const hero = document.querySelector("main section");
    const y = (hero ? hero.getBoundingClientRect().bottom : 0) + window.scrollY + 40;
    window.scrollTo(0, y);
  });
  await expect(page.getByRole("complementary", { name: "בר הטעימה" })).toBeHidden();
  await ctx.close();
});

test("no fabricated social proof rendered in pre-launch (no stars, no reader counter)", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // אין דירוג כוכבים ואין מונה קוראים מזויף.
  await expect(page.getByText(/מעל \d+ קוראים|★|⭐/)).toHaveCount(0);
});

test("ask (from the floating pill): station → dilemma → result with tool + sample + disclaimer", async ({
  page,
}) => {
  const dialog = await openAsk(page);
  await expect(dialog.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();

  // תחנה „לפני קשר” → דילמה „מתקשה להתחיל” (בלי שאלת-הקשר) → תוצאה דטרמיניסטית
  // הממופה לכלי fact-story-action ולטעימת before-relationship.
  await pick(dialog.getByRole("radio", { name: /לפני קשר/ }));
  await pick(dialog.getByRole("radio", { name: /מתקשה להתחיל/ }));

  const article = dialog.getByRole("article");
  await expect(article.getByText("זה הכיוון שהספר מציע לכם כרגע")).toBeVisible();
  // פסקת ההבהרה (לא אבחון/ייעוץ).
  await expect(
    article.getByText("זו הכוונה מתוך הספר, לא אבחון או ייעוץ. אתם מכירים את עצמכם הכי טוב."),
  ).toBeVisible();
  // הכלי כ-deep-link + טעימה מותאמת (tool + station ב-query) + רכישה באמזון.
  await expect(article.locator('a[href="/book#tool-fact-story-action"]')).toBeVisible();
  await expect(
    article.locator('a[href="/preview?tool=fact-story-action&station=before-relationship"]'),
  ).toBeVisible();
  await expect(article.locator('a[href*="amazon.com/dp/B0GJ3SL9H2"]')).toBeVisible();
  await expect(article.locator('a[href="/waitlist"]')).toHaveCount(0);

  // אפשר להתחיל מחדש — חוזרים לבורר התחנות.
  await pick(dialog.getByRole("button", { name: /להתחיל מחדש/ }));
  await expect(dialog.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();
});

test("ask: the station drives the mapped tool, a different station yields a different tool", async ({
  page,
}) => {
  const dialog = await openAsk(page);

  // תחנה אחרת („בתוך קשר”) → דילמה → כלי אחר מזה של „לפני קשר”, הוכחה שהמיפוי
  // תלוי בתחנה. „נוצרו ריחוק ושגרה” ממופה ל-twenty-maintenance.
  await pick(dialog.getByRole("radio", { name: /בתוך קשר/ }));
  await pick(dialog.getByRole("radio", { name: /נוצרו ריחוק ושגרה/ }));
  // ייתכן שתופיע שאלת-הקשר אחת (פרק ב') — בוחרים אפשרות ראשונה.
  const ctx = dialog.getByText("האם משהו מאלה חלק מהתמונה שלכם עכשיו?");
  if (await ctx.count()) await pick(dialog.getByRole("radio").first());

  const article = dialog.getByRole("article");
  await expect(article).toBeVisible();
  await expect(article.locator('a[href="/book#tool-twenty-maintenance"]')).toBeVisible();
  await expect(article.locator('a[href="/book#tool-fact-story-action"]')).toHaveCount(0);
});

test("ask does not transmit answer content to analytics", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push((r.postData() || "") + " " + r.url());
  });
  const dialog = await openAsk(page);
  await pick(dialog.getByRole("radio", { name: /בתוך קשר/ }));
  await pick(dialog.getByRole("radio", { name: /נוצרו ריחוק ושגרה/ }));
  const ctx = dialog.getByText("האם משהו מאלה חלק מהתמונה שלכם עכשיו?");
  if (await ctx.count()) await pick(dialog.getByRole("radio").first());
  await expect(dialog.getByRole("article")).toBeVisible();
  // No request body may contain the answer/question text.
  const leaked = posts.filter((p) => /בתוך קשר|ריחוק ושגרה|נוצרו/.test(p));
  expect(leaked, "answer text must never be transmitted").toEqual([]);
});
