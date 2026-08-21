import { test, expect } from "./fixtures";

import { homePaths } from "../src/content/homePaths";
import { recognition, whyTheBook, authorNote, closing } from "../src/content/homeStory";

/**
 * הקשת הרגשית של עמוד הבית: סקרנות → זיהוי → אמון → רצון → פעולה.
 *
 * לפני המעבר הזה העמוד היה Hero → בחירת-תחנה → רצועת-אמון → רכישה: לא היה רגע
 * זיהוי אחרי ה-Hero, לא הייתה תשובה ל„למה בכלל ספר”, והמחבר הופיע רק כשורת
 * גילוי-נאות. הבדיקות כאן נועלות את שלושת הבּיטים שנוספו ואת *הסדר* ביניהם,
 * כדי ששינוי עתידי לא יחזיר בשקט את המדרון הישן.
 *
 * במפורש: הבדיקות נועלות מבנה והופעה, לא ניסוח. איפה שנבדק טקסט — הוא נשאב
 * מקובצי התוכן עצמם, כדי שעריכת קופי לא תישבר כאן אלא רק אם הביט נעלם.
 */

test.describe("home conversion arc", () => {
  test("the six beats render in the intended emotional order", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const order = [
      "main > section:first-of-type", // Hero — סקרנות
      "[aria-labelledby='recognition-heading']", // זיהוי
      "#path", // בחירת תחנה
      "[aria-labelledby='author-note-heading']", // אמון
      "[aria-labelledby='why-book-heading']", // רצון
      "#get-the-book", // פעולה
    ];

    const tops: number[] = [];
    for (const sel of order) {
      const loc = page.locator(sel).first();
      await expect(loc).toHaveCount(1);
      const box = await loc.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height };
      });
      expect(box.height, `${sel} must occupy real space`).toBeGreaterThan(80);
      tops.push(box.top);
    }

    const sorted = [...tops].sort((a, b) => a - b);
    expect(tops, "beats must appear in the scripted order").toEqual(sorted);
  });

  test("the recognition beat quotes the book itself, not marketing copy", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const beat = page.locator("[aria-labelledby='recognition-heading']");
    await expect(beat.getByRole("heading", { name: recognition.line })).toBeVisible();
    // ציטוט אמיתי מתוך הספר — blockquote עם ייחוס, לא פסקה שיווקית.
    await expect(beat.locator("blockquote")).toContainText(recognition.quote.slice(0, 30));
    await expect(beat.locator("figcaption")).toHaveText(recognition.quoteSource);
  });

  test("the page answers why buy a book when the site already gives so much", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const why = page.locator("[aria-labelledby='why-book-heading']");
    await expect(why.getByRole("heading", { name: whyTheBook.title })).toBeVisible();
    // שני הצדדים מוצגים זה מול זה — האתר כנקודות כניסה, הספר כמסע לפי סדר.
    await expect(why.getByText(whyTheBook.site.label, { exact: true })).toBeVisible();
    await expect(why.getByText(whyTheBook.book.label, { exact: true })).toBeVisible();
    await expect(why.locator("ol > li")).toHaveCount(whyTheBook.book.lines.length);
  });

  test("the author is a reason to trust, and the boundary line survives", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const note = page.locator("[aria-labelledby='author-note-heading']");
    await expect(note.getByText(authorNote.body)).toBeVisible();
    await expect(note.getByText(authorNote.signature, { exact: true })).toBeVisible();
    // הגבול לא נעלם עם רצועת-האמון שהוסרה — הוא עבר לצד האדם.
    await expect(note.getByText(authorNote.boundary)).toBeVisible();
    await expect(note.getByRole("link", { name: authorNote.linkLabel })).toHaveAttribute(
      "href",
      "/author",
    );
  });

  test("no invented authority: no credentials, testimonials, ratings or urgency", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    for (const banned of [
      "פסיכולוג",
      "מטפל זוגי",
      "מוסמך",
      "בעל תואר",
      "קוראים ממליצים",
      "המלצות",
      "דירוג",
      "כוכבים",
      "רק היום",
      "מבצע",
      "הנחה",
      "נותרו",
    ]) {
      expect(body, `homepage must not claim „${banned}”`).not.toContain(banned);
    }
  });

  test("the closing offers two levels of readiness, not one wall", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const block = page.locator("#get-the-book");
    await expect(block.getByRole("heading", { name: closing.title })).toBeVisible();
    await expect(block.getByRole("link", { name: "לרכישה באמזון" })).toHaveAttribute(
      "href",
      /amazon\.com\/dp\/B0GJ3SL9H2/,
    );
    await expect(block.getByRole("link", { name: closing.secondaryLabel })).toHaveAttribute(
      "href",
      "/preview",
    );
    // הזמינות נאמרת פעם אחת בלבד — לא ככותרת ושוב ככיתוב מעליה.
    await expect(block.getByText("זמין עכשיו במהדורת Kindle באמזון")).toHaveCount(1);
  });
});

test.describe("journey cards read as recognition, not navigation", () => {
  // 320 הוא הרוחב הצר ביותר שנתמך; 390 הוא מובייל טיפוסי. שורת-הזיהוי הוסתרה
  // בעבר מתחת ל-sm, כלומר דווקא לרוב המבקרים נותר תפריט של ארבע כותרות.
  for (const width of [320, 390, 768, 1440]) {
    test(`each card shows its felt-state line at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });

      const cards = page.locator(".path-station");
      await expect(cards).toHaveCount(homePaths.length);

      for (const [index, path] of homePaths.entries()) {
        const card = cards.nth(index);
        await expect(card).toHaveAttribute("href", path.stationHref);
        const sub = card.getByText(path.buttonSub);
        await expect(sub).toBeVisible();
        // יעד-מגע — הכרטיס כולו, לא רק החץ.
        const box = await card.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    });
  }
});
