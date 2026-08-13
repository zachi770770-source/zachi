import { test, expect, type Page } from "./fixtures";

/**
 * „נראה בפועל” לדף הבית האישי המקוצר: שלושת אזורי-התוכן (Hero, „איפה זה פוגש
 * אותך עכשיו?” #path, וסגירת הרכישה באמזון #get-the-book) מרונדרים עם bounding-box חיובי,
 * display/visibility גלויים, opacity גלוי, טקסט ממשי — ואינם חופפים (סדר אנכי
 * תקין). נבדק ב-reduced-motion כדי לאמת את מצב-הבסיס הגלוי.
 *
 * בנוסף: אין גלישה אופקית ברוחבי מובייל/טאבלט/דסקטופ נפוצים (כולל 430).
 */

const SECTIONS = [
  { name: "Hero", sel: "main > section:first-of-type" },
  { name: "בחירת המצב", sel: "#path" },
  { name: "רכישה באמזון", sel: "#get-the-book" },
];

async function boxOf(page: Page, sel: string) {
  return page.locator(sel).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      op: parseFloat(cs.opacity),
      vis: cs.visibility,
      disp: cs.display,
      w: r.width,
      h: r.height,
      top: r.top + window.scrollY,
      bottom: r.bottom + window.scrollY,
      text: (el.textContent || "").replace(/\s+/g, " ").trim().length,
    };
  });
}

test("home (before selection): three content areas really visible, real text, vertical order (no overlap)", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  const boxes: { name: string; top: number; bottom: number }[] = [];
  for (const { name, sel } of SECTIONS) {
    const b = await boxOf(page, sel);
    expect(b.w, `${name}: width>0`).toBeGreaterThan(0);
    expect(b.h, `${name}: height>0`).toBeGreaterThan(0);
    expect(b.disp, `${name}: not display:none`).not.toBe("none");
    expect(b.vis, `${name}: visible`).toBe("visible");
    expect(b.op, `${name}: opacity~1`).toBeGreaterThan(0.9);
    expect(b.text, `${name}: has real text`).toBeGreaterThan(10);
    boxes.push({ name, top: b.top, bottom: b.bottom });
  }
  for (let i = 1; i < boxes.length; i++) {
    expect(
      boxes[i].top,
      `"${boxes[i].name}" must start below "${boxes[i - 1].name}"`,
    ).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 2);
  }
  await ctx.close();
});

test("home: four real navigation cards linking to the four journey pages", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  for (const name of [/אני מחפש/, /אני בתחילת/, /אני בתוך/, /אני אחרי/]) {
    await expect(path.locator("summary", { hasText: name })).toBeVisible();
  }
  for (const href of [
    "/before-relationship",
    "/building-relationship",
    "/inside-relationship",
    "/after-breakup",
  ]) {
    await expect(path.locator(`a[href="${href}"]`)).toHaveCount(1);
  }
  // אין עוד result-panel בבית.
  await expect(page.locator(".path-panel")).toHaveCount(0);
  await ctx.close();
});

for (const w of [320, 360, 390, 430, 768, 1024, 1280, 1440]) {
  test(`home: no horizontal overflow at ${w}px (scrolled through)`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: 850 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    // הבית הוא שער (בלי result-panel) — אין גלישה אופקית לכל אורך הגלילה.
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y <= h; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 20));
      }
      window.scrollTo(0, 0);
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${w}px`).toBeLessThanOrEqual(1);
    await ctx.close();
  });
}
