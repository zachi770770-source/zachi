import { test, expect } from "./fixtures";

/**
 * עמוד ההצצה (/preview) — נפתח מיד ללא אימייל, חוויית קריאה ספרותית עם „דפדוף”
 * בין החלקים, מעבר למצפן, CTA דביק במובייל שאינו מכסה טופס/פוטר, ורשימת המתנה
 * עם מצבי הצלחה/כשל. אין רכישה/מחיר/checkout.
 */

test("/preview opens immediately (no email gate) with the reading experience", async ({ page }) => {
  const res = await page.goto("/preview", { waitUntil: "networkidle" });
  expect(res?.status()).toBe(200);
  // הקטע נקרא מיד — אין קיר הרשמה.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "התקדמות הקריאה" })).toHaveCount(1);
  // עוגן מעבר הכריכה מה-Hero קיים ביעד.
  await expect(page.locator("[data-vt-book-dest]")).toHaveCount(1);
  // גוף הקריאה גלוי בפועל (סטטי, בלי מנגנון-חשיפה שיכול להשאיר opacity:0).
  const lead = page.locator(".living-ink .reader-lead");
  await expect(lead).toBeVisible();
  await expect(lead).toHaveCSS("opacity", "1");
});

test("/preview renders the canonical book excerpt continuously (opening + closing visible, no CTA inside)", async ({
  page,
}) => {
  await page.goto("/preview", { waitUntil: "networkidle" });

  const reading = page.locator('section[aria-labelledby="canonical-reading-heading"]');
  await expect(reading).toHaveCount(1);

  // מסגור עריכתי: שם המקטע מהמבוא + זמן קריאה אמיתי (לא בלוק שיווקי).
  await expect(reading.getByRole("heading", { name: "החלק השני של האהבה" })).toBeVisible();

  // משפט-הפתיחה ומשפט-הסיום גלויים בפועל — הקטע רציף, בלי read-more/קיפול/קטיעה.
  await expect(
    reading.getByText(/מאוחר מדי, בכמה קשרים שכבר לא יכולתי להציל/),
  ).toBeVisible();
  await expect(
    reading.getByText(/אלא כשבונים קשר שיש בו אמת ונוכחות\.$/),
  ).toBeVisible();

  // תשע פסקאות רצופות מרונדרות במלואן.
  await expect(reading.locator("p.font-serif")).toHaveCount(9);

  // אין שום CTA רכישה/אמזון בתוך חוויית הקריאה עצמה — הרכישה באה אחריה.
  await expect(reading.locator('a[href*="amazon"]')).toHaveCount(0);
  await expect(reading.locator("a")).toHaveCount(0);

  // עדיין H1 יחיד בעמוד (הקריאה הקנונית היא h2).
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("/preview has a clear transition to the compass and buys via Amazon (no local checkout)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  await expect(page.locator('a[href="/compass"]').first()).toBeVisible();
  // הרכישה עוברת לאמזון (חיצוני) — לא checkout מקומי.
  await expect(page.locator('a[href*="amazon.com/dp/B0GJ3SL9H2"]').first()).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test("/preview mobile: אין שום בקרה צפה — הקריאה מחזיקה את המסך לבדה", async ({
  browser,
}) => {
  // הבדיקה התהפכה במכוון. קודם היא שמרה על בר-CTA דביק בתוך עמוד-הקריאה;
  // הבר הוסר, יחד עם בועת-המצפן, מפני שעמוד-הטעימה הוא חוויית קריאה שקטה
  // וכל שכבה שמרחפת מעליה מתחרה בה. הטענה החדשה חזקה יותר: *אף* אלמנט
  // fixed/sticky אינו מרחף מעל התוכן (למעט ההדר), בשום מיקום-גלילה.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 3000 }).catch(() => {});

  for (const frac of [0, 0.35, 0.7, 1]) {
    await page.evaluate((f) => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.body.scrollHeight * f);
    }, frac);
    await page.waitForTimeout(250);
    const floats = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.position !== "fixed" && cs.position !== "sticky") return false;
          if (cs.visibility === "hidden" || cs.opacity === "0") return false;
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 20) return false;
          return !el.closest("header");
        })
        .map((el) => el.tagName + "." + String(el.className).slice(0, 40)),
    );
    expect(floats, `floating layers at ${frac * 100}% of /preview`).toEqual([]);
  }
  await ctx.close();
});

test("/preview closing: Amazon is the primary and only purchase action (no waitlist, no form)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  const join = page.locator("#join");
  await join.scrollIntoViewIfNeeded();

  // פעולה ראשית: רכישה באמזון (חיצוני) — הקורא שסיים את הטעימה מוכן לקנות.
  await expect(
    join.getByRole("link", { name: /לרכישת הספר באמזון/ }),
  ).toHaveAttribute("href", /amazon\.com\/dp\/B0GJ3SL9H2/);

  // אין טופס הרשמה ואין קישור לרשימת המתנה — אמזון הוא ערוץ הרכישה היחיד.
  await expect(join.getByLabel("כתובת אימייל")).toHaveCount(0);
  await expect(join.locator('a[href="/waitlist"]')).toHaveCount(0);
});
