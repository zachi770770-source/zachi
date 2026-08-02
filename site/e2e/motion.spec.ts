import { test, expect } from "@playwright/test";

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

test("stage pages share a journey motif that marks the current station", async ({
  page,
}) => {
  await page.goto("/starting-again", { waitUntil: "networkidle" });
  await expect(page.locator("h1")).toBeVisible();
  // שלוש התחנות קיימות כנקודות בתוך ה-header.
  const dots = page.locator("header span.rounded-full");
  expect(await dots.count()).toBeGreaterThanOrEqual(3);
  // הצומת הנוכחי בולט (טבעת) — נמצא אחד לפחות.
  const current = page.locator("header span.ring-4");
  expect(await current.count()).toBe(1);
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

test("hero book: entrance settles to full opacity and rest position", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "load" });
  const media = page.locator(".hero-book-media");
  await expect(media).toBeVisible();
  // ממתינים שהכניסה תסתיים (delay 220 + 760ms) — אטימות מלאה ו-transform
  // שהתיישב לזהות. poll כדי למנוע flakiness תלוי-תזמון.
  await page.waitForFunction(
    () => {
      const el = document.querySelector(".hero-book-media");
      if (!el) return false;
      const cs = getComputedStyle(el);
      const t = cs.transform;
      return (
        cs.opacity === "1" &&
        (t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)")
      );
    },
    undefined,
    { timeout: 5000 }
  );
});

test("hero book: reduced-motion shows the final state immediately (no entrance)", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const media = page.locator(".hero-book-media");
  // ללא המתנה לכניסה — תחת reduced-motion חייב להיות גלוי מיד במצב הסופי.
  await expect(media).toHaveCSS("opacity", "1");
  await ctx.close();
});
