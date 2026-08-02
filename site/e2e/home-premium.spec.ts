import { test, expect } from "./fixtures";

/**
 * שיפורים ממוקדים לעמוד הבית (מעל הרדיזיין המאושר): פס עובדות, טיזר מחבר
 * בגוף ראשון, ציטוט מהספר, תיאום בקרות צפות מול באנר העוגיות, וללא גלישה
 * אופקית ב-320/360/390. התנועה המאושרת אינה משתנה כאן.
 */

test("trust strip: three facts below the hero, as an accessible list", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const strip = page.getByRole("region", { name: "עובדות על הספר" });
  await expect(strip).toBeVisible();
  await expect(strip.getByRole("listitem")).toHaveCount(3);
  await expect(strip).toContainText("3 תחנות במסע הזוגי");
  await expect(strip).toContainText("6 כלים מעשיים");
  await expect(strip).toContainText("טעימה חופשית מהספר");
});

test("author teaser is written in the first person", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const author = page.locator("#author-teaser");
  await expect(author).toContainText("כתבתי את");
  await expect(author).toContainText("רציתי ליצור ספר");
  await expect(author).not.toContainText("צחי חן זיהה");
});

test("conversion journey: thesis anchor precedes the stage section on the homepage", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("#thesis-heading")).toBeVisible();
  // חוויית התחנות היחידה (PHASE 16): הבורר האינטראקטיבי #where.
  await expect(page.locator("#where")).toBeVisible();

  // סדר ה-DOM: התזה (עוגן) לפני תחנת הקשר (זיהוי + ניתוב).
  const thesisBeforeStations = await page.evaluate(() => {
    const thesis = document.querySelector("#thesis-heading");
    const stations = document.querySelector("#where");
    if (!thesis || !stations) return false;
    return !!(
      thesis.compareDocumentPosition(stations) &
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
  expect(thesisBeforeStations).toBe(true);
});

test("mobile 390: assistant bubble is hidden while the cookie banner is open, and restored after consent", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  const banner = page.getByRole("region", { name: "הסכמה לשימוש בעוגיות" });
  await expect(banner).toBeVisible();

  // הבועה הצפה (position:fixed, aria-label „שאלו את הספר”) — מזוהה לפי fixed
  const fixedBubbleVisible = () =>
    page.evaluate(() => {
      const btns = Array.from(
        document.querySelectorAll('button[aria-label="שאלו את הספר"]')
      );
      const fixed = btns.find((b) => getComputedStyle(b).position === "fixed");
      if (!fixed) return false;
      const cs = getComputedStyle(fixed);
      return (
        cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        parseFloat(cs.opacity || "1") > 0
      );
    });

  // אות-מצב מפורש מ-CookieConsent (data-attribute), לא הסקה מריווח CSS.
  // הבאנר גם שומר מקום בתחתית (לא רק z-index) והבועה מוסתרת במובייל בזמן פתיחה.
  await page.waitForFunction(
    () => document.body.getAttribute("data-cookie-banner") === "open"
  );
  expect(await fixedBubbleVisible()).toBe(false);

  await page.getByRole("button", { name: "אישור הכל" }).click();
  await expect(banner).toHaveCount(0);
  // האות המפורש מתנקה עם סגירת ההסכמה.
  await page.waitForFunction(
    () => !document.body.hasAttribute("data-cookie-banner")
  );

  // מיד אחרי ההסכמה, עדיין בראש העמוד: הבועה מוסתרת בכוונה כדי לא להתחרות
  // בטופס ההרשמה שבשער בטעינה הראשונית.
  expect(await fixedBubbleVisible()).toBe(false);

  // גלילה מעבר לאזור השער חושפת את הבועה בעדינות.
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForFunction(() => {
    const btns = Array.from(
      document.querySelectorAll('button[aria-label="שאלו את הספר"]')
    );
    const fixed = btns.find((b) => getComputedStyle(b).position === "fixed");
    if (!fixed) return false;
    const cs = getComputedStyle(fixed);
    return cs.display !== "none" && parseFloat(cs.opacity || "1") > 0;
  });
  expect(await fixedBubbleVisible()).toBe(true);

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

test("reduced-motion: trust strip and thesis text are fully visible", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("region", { name: "עובדות על הספר" })
  ).toContainText("6 כלים מעשיים");
  const thesis = page.locator("#thesis-heading");
  await thesis.scrollIntoViewIfNeeded();
  await expect(thesis).toContainText("אהבה היא בנייה.");
  await ctx.close();
});
