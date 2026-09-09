import { test, expect, type Locator, type Page } from "./fixtures";
import { sampleCtaLabel } from "../src/content/sample";

/**
 * מעורבות בטרום-השקה: טעימה ללא-חיכוך, ומנוע-הכוונה שנכנסים אליו בבחירה.
 *
 * מה שירד מכאן ולמה: שתי בדיקות „בר-הטעימה החכם”. הבר עצמו הוסר — נמדד
 * שבמובייל הוא ובועת-המצפן כיסו יחד את ה-CTA הסוגר של עמוד הבית, כלומר
 * התחרו בדיוק במה שבאו לשרת. אותה הזמנה קיימת עכשיו כמקטע בזרימה
 * (`SampleBridge`), שאינו יכול לכסות דבר.
 *
 * מה שנשמר במלואו: כל שלוש בדיקות מנוע-ההכוונה — הרכב-התוצאה, תלות-התחנה
 * בכלי, ואי-שידור תוכן-התשובות לאנליטיקה. הן רק נכנסות אליו דרך הדלת
 * שמבקר אמיתי משתמש בה עכשיו.
 */

/**
 * פותח את מנוע-ההכוונה. הגלולה הצפה הוסרה מכל האתר, ולכן הכניסה היא דרך
 * הדלת המסומנת שבעמוד הבית — בדיוק כפי שמבקר אמיתי נכנס עכשיו. שרשרת-הכניסה
 * עצמה נבדקת כאן, ולא רק המנוע: אם הדלת תיעלם או תשנה יעד, הבדיקה תיפול.
 */
async function openAsk(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 3000 }).catch(() => {});
  const door = page.locator(".deeper-entry a[href='/compass']");
  await door.scrollIntoViewIfNeeded();
  await Promise.all([page.waitForURL(/\/compass$/), door.click()]);
  return page.locator("main");
}

/** לוחצים על רדיו/כפתור אחרי עיגון למרכז — ה-header הדביק מכסה את ראש התצוגה. */
async function pick(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await locator.click();
}

test("zero-friction: hero sample link opens /preview with no registration", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hero = page.locator("main section").first();
  const link = hero.getByRole("link", { name: sampleCtaLabel() });
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

test("no fabricated social proof rendered in pre-launch (no stars, no reader counter)", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // אין דירוג כוכבים ואין מונה קוראים מזויף.
  await expect(page.getByText(/מעל \d+ קוראים|★|⭐/)).toHaveCount(0);
});

test("ask (מהדלת המסומנת בבית): station → dilemma → result with tool + sample + disclaimer", async ({
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
