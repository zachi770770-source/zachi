import { test, expect } from "./fixtures";

/**
 * שיפורים ממוקדים לעמוד הבית (מעל הרדיזיין המאושר): תיאום בקרות צפות מול באנר
 * העוגיות, וללא גלישה אופקית ב-320/360/390. התנועה המאושרת אינה משתנה כאן.
 */

// בקיצור העמוד הוסרו מהבית: פס-העובדות („TrustStrip”), טיזר-המחבר (#author-teaser),
// מקטע „שאל את הספר” המוטמע (#where) וסצנת Search→Build (#thesis-heading). הבדיקות
// שנשענו עליהם הוסרו בהתאם — אין להמציא/להחזיר תוכן שלא מוצג.

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

test("reduced-motion: the path-selector area is fully visible", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  // תחת reduced-motion אין הסתרה — כותרת אזור הבחירה וכרטיסי-הניווט קריאים במלואם.
  const path = page.locator("#path");
  await path.scrollIntoViewIfNeeded();
  await expect(path).toContainText("איפה זה פוגש אותך עכשיו?");
  await expect(path.getByRole("link", { name: /אני מחפש/ })).toBeVisible();
  await ctx.close();
});
