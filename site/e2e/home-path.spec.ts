import { test, expect } from "./fixtures";

/**
 * „איפה זה פוגש אותך עכשיו?” — שער אמיתי לארבע חוויות. הבדיקות מוודאות את
 * הארכיטקטורה החדשה: כל אחת מארבע הבחירות היא *קישור* שמנווט לעמוד-המסע הייעודי,
 * אין עוד result-panel שנפתח בבית, והכרטיסים קיימים כ-<a> אמיתיים גם בלי JS.
 */

const CARDS = [
  { name: /אני מחפש/, href: "/before-relationship" },
  { name: /אני בתחילת/, href: "/building-relationship" },
  { name: /אני בתוך/, href: "/inside-relationship" },
  { name: /אני אחרי/, href: "/after-breakup" },
] as const;

test("the four choices are links to the four journey pages — no in-Home result panel", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await expect(path.getByRole("heading", { name: "איפה זה פוגש אותך עכשיו?" })).toBeVisible();

  // ארבעה קישורים אמיתיים ליעדים הנכונים.
  for (const c of CARDS) {
    await expect(path.getByRole("link", { name: c.name })).toHaveAttribute("href", c.href);
  }
  // אין עוד בלוק-תוצאה בבית (הארכיטקטורה הישנה הוסרה).
  await expect(page.locator(".path-panel")).toHaveCount(0);
  await expect(page.locator('[id^="path-panel-"]')).toHaveCount(0);
});

for (const c of CARDS) {
  test(`clicking "${c.href}" navigates to that journey page`, async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#path").getByRole("link", { name: c.name }).click();
    await expect(page).toHaveURL(new RegExp(`${c.href}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("keyboard: Enter on a focused card navigates to its journey page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.locator("#path").getByRole("link", { name: /אני בתחילת/ });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/building-relationship$/);
});

test("no-JS safety: the four cards exist as real <a> to the journey pages without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (const c of CARDS) {
    await expect(page.locator(`#path a[href="${c.href}"]`)).toHaveCount(1);
  }
  await ctx.close();
});

test("no-JS navigation: with JavaScript disabled, clicking a card still lands on its journey page", async ({
  browser,
}) => {
  // התלות המסוכנת: ניווט שנשען על JS. הכרטיסים הם <a href> נטיביים, ולכן
  // הניווט חייב לעבוד גם כשה-JS כבוי לחלוטין (אין hydration, אין router.push).
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator('#path a[href="/after-breakup"]').click();
  await expect(page).toHaveURL(/\/after-breakup$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await ctx.close();
});

test("mobile 390: nothing overlays the cards — elementFromPoint at each card center hits its own link", async ({
  browser,
}) => {
  // audit אמיתי מול overlays (cookie banner, floating „שאל את הספר”, sticky,
  // ::before/::after, absolute/fixed, z-index, pointer-events). במרכז כל
  // כרטיס — האלמנט העליון חייב להיות הקישור עצמו או ילד שלו, ולא overlay.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  const results = await page.evaluate((hrefs) => {
    const out: Array<{
      href: string;
      hitsOwnLink: boolean;
      pointerEvents: string;
      topTag: string;
    }> = [];
    for (const href of hrefs) {
      const a = document.querySelector<HTMLAnchorElement>(`#path a[href="${href}"]`);
      if (!a) {
        out.push({ href, hitsOwnLink: false, pointerEvents: "n/a", topTag: "MISSING" });
        continue;
      }
      a.scrollIntoView({ block: "center" });
      const r = a.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      out.push({
        href,
        // האלמנט שנפגע במרכז הוא הקישור עצמו, או צאצא שלו (span/svg בתוך <a>).
        hitsOwnLink: !!top && (top === a || a.contains(top)),
        pointerEvents: top ? getComputedStyle(top).pointerEvents : "none",
        topTag: top ? top.tagName : "null",
      });
    }
    return out;
  }, CARDS.map((c) => c.href));

  for (const res of results) {
    expect(res.hitsOwnLink, `overlay intercepts tap at ${res.href} (top=${res.topTag})`).toBe(true);
    expect(res.pointerEvents, `pointer-events blocked at ${res.href}`).not.toBe("none");
  }
});
