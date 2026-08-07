import { test, expect, type Page } from "./fixtures";

/**
 * „איפה זה פוגש אותך עכשיו?” — בחירה דטרמיניסטית מקומית בעמוד הבית. הבדיקות
 * מוודאות: הבחירה מחליפה תוכן, רק המצב הנבחר מוצג, מעבר בין מצבים, שחזור מ-
 * localStorage אחרי refresh, פעולה ראשית „שאל את הספר” + קישור-תחנה, מקלדת
 * מלאה, reduced-motion, ובעיקר — התוכן הנבחר נשאר גלוי לאורך זמן (100ms→15s),
 * לא חוזרים על באג /preview.
 */

const PANELS = ["dating", "building", "existing", "breakup"] as const;

async function selectByReducedMotion(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
}

test("before selection: no state panel is visible; after selecting, only that panel shows", async ({ page }) => {
  await selectByReducedMotion(page);
  // לפני בחירה — אין בלוק גלוי (אין „אזור ריק שמחכה”).
  for (const id of PANELS) {
    await expect(page.locator(`#path-panel-${id}`)).toBeHidden();
  }
  await page.getByRole("button", { name: /אני מחפש/ }).click();
  await expect(page.locator("#path-panel-dating")).toBeVisible();
  await expect(page.locator("#path-panel-dating")).toContainText(
    "כשמחפשים אהבה — גם הדרך שבה בוחרים היא חלק מהקשר.",
  );
  // רק המצב הנבחר מוצג.
  for (const id of ["building", "existing", "breakup"] as const) {
    await expect(page.locator(`#path-panel-${id}`)).toBeHidden();
  }
  // aria-pressed משקף את הבחירה.
  await expect(page.getByRole("button", { name: /אני מחפש/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /אני בתוך/ })).toHaveAttribute("aria-pressed", "false");
});

test("switching states replaces the visible content", async ({ page }) => {
  await selectByReducedMotion(page);
  await page.getByRole("button", { name: /אני מחפש/ }).click();
  await expect(page.locator("#path-panel-dating")).toBeVisible();

  await page.getByRole("button", { name: /אני אחרי/ }).click();
  await expect(page.locator("#path-panel-breakup")).toBeVisible();
  await expect(page.locator("#path-panel-dating")).toBeHidden();
  await expect(page.locator("#path-panel-breakup")).toContainText(
    "לפני שמתחילים מחדש — כדאי להבין מה בדיוק הסתיים.",
  );
});

test("selection persists across reload within the session (sessionStorage), without tracking", async ({ page }) => {
  await selectByReducedMotion(page);
  await page.getByRole("button", { name: /אני בתוך/ }).click();
  await expect(page.locator("#path-panel-existing")).toBeVisible();

  // רענון באותה גלישה (אותו tab/session) — הבחירה משוחזרת מ-sessionStorage.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#path-panel-existing")).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole("button", { name: /אני בתוך/ })).toHaveAttribute("aria-pressed", "true");

  // ביקור חדש (context חדש = session נקי) מתחיל ללא בחירה.
  const fresh = await page.context().browser()!.newContext();
  const p2 = await fresh.newPage();
  await p2.goto("/", { waitUntil: "networkidle" });
  await expect(p2.locator("#path-panel-existing")).toBeHidden();
  await fresh.close();
});

test("selected panel shows the primary „שאל את הספר” CTA (→/compass) and the station link", async ({ page }) => {
  await selectByReducedMotion(page);
  await page.getByRole("button", { name: /אני מחפש/ }).click();
  const panel = page.locator("#path-panel-dating");
  await expect(panel).toBeVisible();
  // פעולה ראשית „שאל את הספר” → /compass.
  const ask = panel.getByRole("link", { name: "שאל את הספר" });
  await expect(ask).toHaveAttribute("href", "/compass");
  // קישור משני לעמוד התחנה.
  await expect(panel.locator('a[href="/before-relationship"]')).toHaveCount(1);
  // התוצאה המקוצרת אינה כוללת עוד את פסקת הפתיחה הארוכה של הכלי.
  await expect(panel).not.toContainText("אולי יצאתם כבר ללא מעט דייטים");
});

test("keyboard: Enter selects a state", async ({ page }) => {
  await selectByReducedMotion(page);
  const btn = page.getByRole("button", { name: /אני בתחילת/ });
  await btn.focus();
  await expect(btn).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#path-panel-building")).toBeVisible();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
});

test("no-JS safety: the four state buttons + station links exist in HTML without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // ארבעת הכפתורים קיימים, וכל קישורי-התחנות קיימים ב-HTML (SSR) — גם בלי JS.
  await expect(page.getByRole("button", { name: /אני מחפש/ })).toHaveCount(1);
  for (const href of [
    "/before-relationship",
    "/building-relationship",
    "/inside-relationship",
    "/after-breakup",
  ]) {
    await expect(page.locator(`#path a[href="${href}"]`)).toHaveCount(1);
  }
  await ctx.close();
});

test("selected content stays visible at 100ms / 1s / 3s / 8s / 15s (post-hydration, real motion)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "commit" });
  // ודא hydration (motion-js נוסף), ואז בחר מצב.
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("motion-js")))
    .toBe(true);
  await page.getByRole("button", { name: /אני מחפש/ }).click();
  const heading = page.locator("#path-panel-dating-heading");
  const check = async () => {
    const info = await heading.evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { op: parseFloat(cs.opacity), vis: cs.visibility, w: r.width, h: r.height };
    });
    expect(info.op).toBeGreaterThanOrEqual(0.95);
    expect(info.vis).toBe("visible");
    expect(info.w).toBeGreaterThan(0);
    expect(info.h).toBeGreaterThan(0);
  };
  for (const ms of [100, 900, 2000, 5000, 7000]) {
    await page.waitForTimeout(ms);
    await check();
  }
});
