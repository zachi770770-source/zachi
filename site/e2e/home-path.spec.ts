import { test, expect } from "./fixtures";

/**
 * „איפה זה פוגש אותך עכשיו?” — רגע-זיהוי, לא רק תפריט ניווט. רשת 2×2 של
 * radio-cards + תגובה משותפת אחת מתחת: בחירת מצב חושפת זיהוי + מוקד אחד +
 * קישור-המשך אמיתי. בחירה (radio) וניווט (link) נפרדות. הקישורים קיימים תמיד
 * ב-HTML (SEO / ללא-JS); התגובה מתחלפת דרך CSS ‏:has(:checked) — בלי JS.
 */

const STAGES = [
  { name: /אני מחפש/, href: "/before-relationship", reveal: "גם הדרך שבה בוחרים" },
  { name: /אני בתחילת/, href: "/building-relationship", reveal: "מה בונים ממנה" },
  { name: /אני בתוך/, href: "/inside-relationship", reveal: "לא כל קושי אומר" },
  { name: /אני אחרי/, href: "/after-breakup", reveal: "מה בדיוק הסתיים" },
] as const;

test("#path: 2×2 radio selector; four links present; recognition hidden until a stage is chosen", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await expect(
    path.getByRole("heading", { name: "איפה זה פוגש אותך עכשיו?" })
  ).toBeVisible();

  // ארבע בחירות (radio) + ארבעה קישורי-המשך קיימים ב-DOM (SEO/ללא-JS).
  await expect(path.getByRole("radio")).toHaveCount(4);
  for (const s of STAGES) {
    await expect(path.getByRole("radio", { name: s.name })).toHaveCount(1);
    await expect(path.locator(`a[href="${s.href}"]`)).toHaveCount(1);
  }
  // אין בחירה בהתחלה → אין תגובה גלויה.
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeHidden();
  await expect(page.locator(".path-panel")).toHaveCount(4);
});

test("choosing a stage reveals its recognition in the shared panel; continue link navigates", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  await path.getByRole("radio", { name: /אני מחפש/ }).check({ force: true });
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeVisible();

  const cont = path.locator('a[href="/before-relationship"]');
  await expect(cont).toBeVisible();
  await cont.click();
  await expect(page).toHaveURL(/\/before-relationship$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("switching the stage replaces the content in the same shared region (one at a time)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  await path.getByRole("radio", { name: /אני מחפש/ }).check({ force: true });
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeVisible();

  await path.getByRole("radio", { name: /אני אחרי/ }).check({ force: true });
  await expect(path.getByText("מה בדיוק הסתיים", { exact: false })).toBeVisible();
  await expect(path.getByText("גם הדרך שבה בוחרים", { exact: false })).toBeHidden();
});

test("keyboard: focus a radio and Space selects it, revealing its recognition", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  const radio = path.getByRole("radio", { name: /אני בתחילת/ });
  await radio.focus();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await expect(path.getByText("מה בונים ממנה", { exact: false })).toBeVisible();
});

test("no-JS: links exist in the DOM; native radio selection reveals + navigates the continue link", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const path = page.locator("#path");
  for (const s of STAGES) {
    await expect(path.locator(`a[href="${s.href}"]`)).toHaveCount(1);
  }
  // ללא JS: בחירת radio נטיבית → CSS חושף את הפאנל → קישור-ההמשך מנווט.
  await path.getByRole("radio", { name: /אני אחרי/ }).check({ force: true });
  const cont = path.locator('a[href="/after-breakup"]');
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
  const path = page.locator("#path");

  await path.getByRole("radio", { name: /אני אחרי/ }).check({ force: true });
  const cont = path.locator('a[href="/after-breakup"]');
  await cont.scrollIntoViewIfNeeded();

  const hit = await page.evaluate(() => {
    const a = document.querySelector('#path a[href="/after-breakup"]');
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
