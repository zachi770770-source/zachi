import { test, expect } from "./fixtures";

/**
 * שדרוג המעורבות בטרום-השקה: טעימה ללא-חיכוך + בר-טעימה חכם.
 * הכללים: אין רכישה; הטעימה נגישה ללא הרשמה; הבר מופיע רק אחרי ה-Hero,
 * מפנה ל-/preview, נסגר ונזכר ל-session.
 */

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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
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

test("path finder: three questions map deterministically to a station + tool + disclaimer", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();
  await expect(where.getByRole("heading", { name: "איפה אתם נמצאים במסע הזוגי שלכם?" })).toBeVisible();

  // Q1 "אני מחפש/ת קשר" → deterministically the before-relationship station.
  await where.getByRole("radio", { name: "אני מחפש/ת קשר" }).click();
  // Q1(before-relationship) × Q2(index 0 "נועל מסקנה") → "שלוש שאלות השער".
  await where.getByRole("radio", { name: /נועל.*מסקנה/ }).click();
  // Q3 = "לקרוא קטע שמתאים לי" → sample emphasis sets the PRIMARY CTA to a
  // contextual /preview?tool=&station= link.
  await where.getByRole("radio", { name: /קטע שמתאים לי/ }).click();

  // Result: the mapped station, the mapped real tool, the required disclaimer.
  await expect(where.getByText(/נקודת הפתיחה שלכם/)).toBeVisible();
  await expect(where.getByText("שלוש שאלות השער")).toBeVisible();
  await expect(where.getByText("זו נקודת פתיחה לקריאה, לא אבחון או ייעוץ.")).toBeVisible();
  // The station page stays reachable as a quiet secondary action.
  await expect(where.getByRole("link", { name: /לתחנה המלאה: לפני קשר/ })).toHaveAttribute(
    "href",
    "/before-relationship"
  );
  // Q3=sample → the primary action is the contextual sample (tool + station in the query).
  await expect(
    where.getByRole("link", { name: "לקרוא את הקטע שמתאים לי" })
  ).toHaveAttribute("href", "/preview?tool=gate-questions&station=before-relationship");

  // Restart returns to question 1.
  await where.getByRole("button", { name: "להתחיל מחדש" }).click();
  await expect(where.getByText("שאלה 1/3")).toBeVisible();
});

test("path finder: the life-stage (Q1) changes the mapped tool — all six tools reachable", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();

  // אותו קושי (index 0 "נועל מסקנה"), תחנה אחרת → כלי אחר. „בתוך קשר” + קושי 0
  // ממופה ל„בדיקת השקט” (לא „שלוש שאלות השער”) — הוכחה שהמיפוי תלוי גם ב-Q1.
  await where.getByRole("radio", { name: /בתוך קשר ורוצה לבנות/ }).click();
  await where.getByRole("radio", { name: /נועל.*מסקנה/ }).click();
  await where.getByRole("radio", { name: /קטע שמתאים לי/ }).click();

  const article = where.locator("article");
  await expect(article.getByText("בדיקת השקט")).toBeVisible();
  await expect(article.getByText("שלוש שאלות השער")).toHaveCount(0);
  // הכלי הנכון נגיש כ-deep-link לכרטיס ב-/book (פעולת משנה, כי Q3=טעימה).
  await expect(article.locator('a[href="/book#tool-quiet-check"]')).toBeVisible();
});

test("path finder does not transmit answer content to analytics", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push((r.postData() || "") + " " + r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();
  await where.getByRole("radio", { name: "בתוך קשר" }).click();
  await where.getByRole("radio").first().click();
  await where.getByRole("radio").first().click();
  await expect(where.getByText(/נקודת הפתיחה שלכם/)).toBeVisible();
  // No request body may contain the answer/question text.
  const leaked = posts.filter((p) => /בתוך קשר|נועל|קטע שמתאים/.test(p));
  expect(leaked, "answer text must never be transmitted").toEqual([]);
});
