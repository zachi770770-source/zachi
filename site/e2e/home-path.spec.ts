import { test, expect } from "./fixtures";

/**
 * „איפה זה פוגש אותך עכשיו?” — שער אמיתי לארבע החוויות, בלחיצה אחת.
 * כל מצב הוא קישור יחיד אל עמוד-המסע שלו: אין שלב „בחירה ואז המשך”, אין radio
 * ואין פאנל-זיהוי נפרד. הקישורים קיימים תמיד ב-HTML (SEO / ללא-JS), הניווט
 * נטיבי (Tab + Enter), ובאותה לשונית.
 */

const STAGES = [
  { name: /אני מחפש/, href: "/before-relationship" },
  { name: /אני בתחילת/, href: "/building-relationship" },
  { name: /אני בתוך/, href: "/inside-relationship" },
  { name: /אני אחרי/, href: "/after-breakup" },
] as const;

test("#path: four stage links, one per destination, no selection step", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await expect(
    path.getByRole("heading", { name: "איפה זה פוגש אותך עכשיו?" }),
  ).toBeVisible();

  // ארבעה קישורים — ולא radio-ים. הבחירה *היא* הניווט.
  await expect(path.getByRole("radio")).toHaveCount(0);
  await expect(path.locator(".path-station")).toHaveCount(4);
  for (const s of STAGES) {
    const card = path.locator(`a[href="${s.href}"]`);
    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible();
    await expect(card).toContainText(s.name);
  }
});

for (const s of STAGES) {
  test(`clicking ${s.href} navigates straight to the station page`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator(`#path a[href="${s.href}"]`).click();
    // ניווט צד-לקוח: ממתינים ל-URL, לא ל-load event.
    await page.waitForURL(`**${s.href}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // המשכיות המסע: עמוד-היעד מציג את מחוון-המיקום.
    await expect(page.locator(".journey-position").first()).toBeVisible();
  });
}

test("keyboard: Tab reaches a stage card and Enter navigates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator('#path a[href="/building-relationship"]');
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/building-relationship");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("no-JS: the stage cards are plain links and still navigate", async ({ browser }) => {
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
  await Promise.all([
    page.waitForURL(/\/after-breakup$/),
    path.locator('a[href="/after-breakup"]').click(),
  ]);
  await ctx.close();
});

test("mobile 390: a stage card is a large tap target and is not overlaid", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator('#path a[href="/after-breakup"]');
  await card.scrollIntoViewIfNeeded();

  const box = await card.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

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
  expect(hit.ok, `overlay intercepts the stage card (top=${hit.tag})`).toBe(true);
  expect(hit.pe).not.toBe("none");
  await ctx.close();
});
