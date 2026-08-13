import { test, expect } from "./fixtures";

/**
 * „איפה זה פוגש אותך עכשיו?” — רגע-זיהוי, לא רק תפריט ניווט. כל מצב הוא
 * `<details>` נטיבי: ה-summary היא הבחירה, פתיחתה חושפת זיהוי + מוקד אחד,
 * וההמשך הוא קישור אמיתי לעמוד-המסע. בחירה וניווט הן פעולות נפרדות. הקישורים
 * קיימים ב-HTML (SEO / ללא-JS), והאקורדיון עובד נטיבית גם בלי JS.
 */

const STAGES = [
  { title: /אני מחפש/, href: "/before-relationship", reveal: "גם הדרך שבה בוחרים" },
  { title: /אני בתחילת/, href: "/building-relationship", reveal: "מה בונים ממנה" },
  { title: /אני בתוך/, href: "/inside-relationship", reveal: "לא כל קושי אומר" },
  { title: /אני אחרי/, href: "/after-breakup", reveal: "מה בדיוק הסתיים" },
] as const;

function detailsFor(page: import("./fixtures").Page, href: string) {
  return page.locator("#path details", { has: page.locator(`a[href="${href}"]`) });
}

test("#path: four stage choices as a native accordion; recognition hidden until selected", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await expect(
    path.getByRole("heading", { name: "איפה זה פוגש אותך עכשיו?" })
  ).toBeVisible();

  // ארבע בחירות (summary) גלויות; ארבעת קישורי-ההמשך קיימים ב-DOM (SEO/ללא-JS).
  await expect(path.locator("summary")).toHaveCount(4);
  for (const s of STAGES) {
    await expect(path.locator("summary", { hasText: s.title })).toBeVisible();
    await expect(path.locator(`a[href="${s.href}"]`)).toHaveCount(1);
  }
  // תוכן הזיהוי סגור כברירת מחדל (אין result-panel נפרד; אין ארכיטקטורה ישנה).
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeHidden();
  await expect(page.locator(".path-panel")).toHaveCount(0);
});

test("selecting a stage reveals its recognition, then the continue link navigates", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  await detailsFor(page, "/before-relationship").locator("summary").click();
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeVisible();

  const cont = path.locator('a[href="/before-relationship"]');
  await expect(cont).toBeVisible();
  await cont.click();
  await expect(page).toHaveURL(/\/before-relationship$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("opening a different stage replaces the response (single-open accordion)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  await detailsFor(page, "/before-relationship").locator("summary").click();
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeVisible();

  await detailsFor(page, "/after-breakup").locator("summary").click();
  await expect(path.getByText("מה בדיוק הסתיים", { exact: false })).toBeVisible();
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeHidden();
});

test("keyboard: focus a summary and Enter reveals its recognition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  const sum = path.locator("summary", { hasText: /אני בתחילת/ });
  await sum.focus();
  await page.keyboard.press("Enter");
  await expect(path.getByText("מה בונים ממנה", { exact: false })).toBeVisible();
});

test("no-JS: stage links exist, and native details still reveals + navigates the continue link", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce", // ללא אנימציית-חשיפה → הקישור יציב לקליק
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (const s of STAGES) {
    await expect(page.locator(`#path a[href="${s.href}"]`)).toHaveCount(1);
  }
  // ללא JS: פתיחת ה-summary נטיבית, ואז קישור-ההמשך מנווט.
  await detailsFor(page, "/after-breakup").locator("summary").click();
  const cont = page.locator('#path a[href="/after-breakup"]');
  await expect(cont).toBeVisible();
  await Promise.all([page.waitForURL(/\/after-breakup$/), cont.click()]);
  await ctx.close();
});

test("mobile 390: the revealed continue link is not overlaid by sticky/floating UI", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const summary = detailsFor(page, "/before-relationship").locator("summary");
  await summary.scrollIntoViewIfNeeded();
  await summary.click();
  const cont = page.locator('#path a[href="/before-relationship"]');
  await cont.scrollIntoViewIfNeeded();

  const hit = await page.evaluate(() => {
    const a = document.querySelector('#path a[href="/before-relationship"]');
    if (!a) return { ok: false, tag: "MISSING", pe: "n/a" };
    const r = a.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      ok: !!top && (top === a || a.contains(top)),
      tag: top ? top.tagName : "null",
      pe: top ? getComputedStyle(top).pointerEvents : "none",
    };
  });
  expect(hit.ok, `overlay intercepts the continue link (top=${hit.tag})`).toBe(true);
  expect(hit.pe).not.toBe("none");
  await ctx.close();
});
