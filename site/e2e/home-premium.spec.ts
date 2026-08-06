import { test, expect } from "./fixtures";

/**
 * שיפורים ממוקדים לעמוד הבית (מעל הרדיזיין המאושר): פס עובדות, טיזר מחבר
 * בגוף ראשון, ציטוט מהספר, תיאום בקרות צפות מול באנר העוגיות, וללא גלישה
 * אופקית ב-320/360/390. התנועה המאושרת אינה משתנה כאן.
 */

// (פס-העובדות „TrustStrip” הוסר מעמוד הבית בקיצור העריכתי — הבדיקה שלו הוסרה
//  בהתאם; אין להמציא/להחזיר תוכן שלא מוצג.)

test("author teaser is written in the first person", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const author = page.locator("#author-teaser");
  await expect(author).toContainText("כתבתי את");
  await expect(author).toContainText("רציתי ליצור ספר");
  await expect(author).not.toContainText("צחי חן זיהה");
});

test("conversion journey: the ask invite (#where) precedes the Search→Build thesis scene", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#where")).toBeVisible();
  await expect(page.locator("#thesis-heading")).toBeVisible();

  // סדר ה-DOM אחרי הקיצור/הארגון-מחדש: מקטע „שאל את הספר” (#where) *לפני* סצנת
  // Search→Build (#thesis-heading) — כדי שלחיצה על „למצוא את המסלול שלי” תגיע
  // לשאלון בלי לחצות את טווח ה-pin של הסצנה.
  const stationsBeforeThesis = await page.evaluate(() => {
    const stations = document.querySelector("#where");
    const thesis = document.querySelector("#thesis-heading");
    if (!thesis || !stations) return false;
    return !!(
      stations.compareDocumentPosition(thesis) &
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
  expect(stationsBeforeThesis).toBe(true);
});

test("mobile 390: assistant bubble stays visible ABOVE the cookie banner (no overlap), and returns to the bottom after consent", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  // במסכים נמוכים (מובייל) באנר העוגיות מזוין רק אחרי שה-CTA הראשי גלל אל מעל
  // פס-הבאנר. גוללים מעט כדי שהבאנר יופיע (וגם מעל סף חשיפת הגלולה).
  await page.evaluate(() => window.scrollTo(0, 220));
  const banner = page.getByRole("region", { name: "הסכמה לשימוש בעוגיות" });
  await expect(banner).toBeVisible();
  await page.waitForFunction(
    () => document.body.getAttribute("data-cookie-banner") === "open"
  );

  // הגלולה הצפה (aria-label מלא) — נבדלת מכפתור ה-#where „שאל את הספר” המדויק.
  const bubble = page.getByRole("button", { name: /שאל את הספר — / });

  // הגלולה נשארת גלויה כשהבאנר פתוח (לא מוסתרת) — נוכחת ולחיצה למשתמש חדש.
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveCSS("opacity", "1", { timeout: 4000 });

  // ואינה חופפת לבאנר — יושבת מעליו עם מרווח ברור (יעד 12–20px).
  const gapAboveBanner = async () => {
    const b = await bubble.boundingBox();
    const c = await banner.boundingBox();
    if (!b || !c) throw new Error("missing box");
    return c.y - (b.y + b.height); // >0 ⇒ הגלולה כולה מעל ראש הבאנר
  };
  const gap = await gapAboveBanner();
  expect(gap, "bubble must sit fully above the banner").toBeGreaterThan(0);
  expect(gap, "clear gap above the banner").toBeGreaterThanOrEqual(8);

  const bottomWhileOpen = (await bubble.boundingBox())!.y;

  await page.getByRole("button", { name: "אישור הכל" }).click();
  await expect(banner).toHaveCount(0);
  await page.waitForFunction(
    () => !document.body.hasAttribute("data-cookie-banner")
  );

  // אחרי ההסכמה — הגלולה נשארת גלויה וחוזרת חלק למיקום התחתון הרגיל (נמוך יותר).
  await expect(bubble).toBeVisible();
  await expect(bubble).toHaveCSS("opacity", "1");
  await page.waitForFunction(
    (prevY) => {
      const el = document.querySelector('button[aria-label^="שאל את הספר"]');
      if (!el) return false;
      return el.getBoundingClientRect().top > prevY + 4; // ירדה כלפי מטה
    },
    bottomWhileOpen,
    { timeout: 4000 }
  );

  await ctx.close();
});

for (const w of [320, 360, 390]) {
  test(`no horizontal overflow at ${w}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y <= h; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo(0, 0);
    });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(over, `overflow at ${w}px`).toBe(false);
    await ctx.close();
  });
}

test("reduced-motion: thesis text is fully visible", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  // תחת reduced-motion אין הסתרה (motion-js לא מתווסף) — התוכן קריא במלואו.
  const thesis = page.locator("#thesis-heading");
  await thesis.scrollIntoViewIfNeeded();
  await expect(thesis).toContainText("אהבה היא בנייה.");
  await ctx.close();
});
