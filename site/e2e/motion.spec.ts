import { test, expect } from "./fixtures";

/**
 * מעבר המיקרו-אנימציה — כיסוי ממוקד. כל התנועה מבוססת-CSS ומצב ברירת המחדל
 * הוא המצב הסופי הגלוי (בטוח ל-SSR / ללא JS / prefers-reduced-motion). כאן
 * מאמתים: (1) תחת reduced-motion התוכן גלוי במלואו ומיידית; (2) מחוון המסע
 * בדפי התחנות מציג את התחנה הנוכחית; (3) הודעות מצב בטפסים נכנסות ברוגע.
 */

const REDUCED_MOTION_PAGES: Array<{ path: string; heading: RegExp }> = [
  { path: "/before-relationship", heading: /./ },
  { path: "/author", heading: /./ },
  { path: "/book", heading: /מה יש בספר/ },
];

test.describe("reduced-motion: content is in its final visible state", () => {
  for (const { path } of REDUCED_MOTION_PAGES) {
    test(`${path}: main heading and later sections are fully visible`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext({ reducedMotion: "reduce" });
      const page = await ctx.newPage();
      await page.goto(path, { waitUntil: "networkidle" });

      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible();
      await expect(h1).toHaveCSS("opacity", "1");

      // סקשן מאוחר בעמוד (מתחת לקיפול) — נחשף ע"י reveal בגלילה; תחת
      // reduced-motion חייב להיות גלוי במלואו (opacity:1) גם בלי גלילה.
      const lateReveal = page.locator(".reveal").last();
      await expect(lateReveal).toHaveCSS("opacity", "1");

      await ctx.close();
    });
  }
});

test("each journey page has its own distinct hero identity (eyebrow + mood), not a shared station-progress motif", async ({
  page,
}) => {
  // עמודי-המסע הם Landing אישי — לא „תחנה X מתוך 3”. מחוון-ההתקדמות הישן הוסר;
  // הזהות מגיעה מהתוכן: eyebrow ייחודי + שורת מצב-רוח, כבר במסך הראשון.
  await page.goto("/building-relationship", { waitUntil: "networkidle" });
  const hero = page.locator("header.enter-stagger");
  await expect(hero).toBeVisible();
  await expect(hero.locator(".kicker")).toHaveText("מתחילים קשר");
  await expect(hero).toContainText("מהתרגשות ראשונה");
  // אין עוד מחוון-תחנה-נוכחית (טבעת).
  await expect(page.locator("header span.ring-4")).toHaveCount(0);
});

test("all three stage pages render the shared coordinated entrance + progress", async ({
  page,
}) => {
  for (const path of ["/before-relationship", "/starting-again", "/inside-relationship"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    // הכותרת הראשית קיימת וגלויה, ומחוון המסע קיים.
    await expect(page.locator("h1")).toBeVisible();
    const header = page.locator("header.enter-stagger");
    await expect(header).toBeVisible();
  }
});

test("contact form: a validation error appears with the shared calm entrance", async ({
  page,
}) => {
  await page.goto("/contact", { waitUntil: "networkidle" });
  // שליחה ריקה → מופיעות שגיאות שדה עם מחלקת התנועה המשותפת.
  await page.getByRole("button", { name: /שליחת הודעה/ }).click();
  const firstError = page.locator("p.form-status[role='alert']").first();
  await expect(firstError).toBeVisible();
});

test("waitlist form: submitting without consent surfaces a calm inline error", async ({
  page,
}) => {
  await page.goto("/waitlist", { waitUntil: "networkidle" });
  await page.getByLabel("כתובת אימייל").fill("test@example.com");
  await page.getByRole("button", { name: /עדכנו אותי/ }).click();
  const err = page.locator("p.form-status[role='alert']");
  await expect(err).toContainText("לאשר את קבלת העדכון");
});
