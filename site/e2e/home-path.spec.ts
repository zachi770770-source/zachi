import { test, expect } from "./fixtures";

import { homePaths, homePathUi } from "../src/content/homePaths";
import { askStations, askUi } from "../src/content/askRoute";

/**
 * „איפה אתם נמצאים עכשיו?” — רגע ההקשבה של עמוד הבית.
 *
 * שכבת הבסיס (SSR / ללא-JS / SEO) לא השתנתה: ארבעה כרטיסי-`<a>` אמיתיים אל
 * עמודי-המסע, וקישור כן „המצב שלי קצת יותר מורכב” אל /compass. מעליה שכבת
 * שיפור-הדרגתי: *עם* JavaScript, בחירת מצב אינה מנווטת אלא פותחת את מנוע „שאל
 * את הספר” (AskRoute) *במקום*, מזוהה לאותה תחנה (מדלג על „איפה אתם?” ומתחיל
 * בדילמה). הכרטיסים מתקפלים והמנוע תופס את מקומם — קומפקטי, בלי ניווט החוצה.
 */

const STAGES = [
  { name: /אני מחפש/, href: "/before-relationship", ask: "dating" },
  { name: /אני בתחילת/, href: "/building-relationship", ask: "building" },
  { name: /אני בתוך/, href: "/inside-relationship", ask: "existing" },
  { name: /אני אחרי/, href: "/after-breakup", ask: "after-breakup" },
] as const;

const stationName = (askId: string) =>
  askStations.find((s) => s.id === askId)!.name;

test("#path: four situation cards + honest complex entry — real links (SEO/no-JS)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await expect(
    path.getByRole("heading", { name: homePathUi.heading }),
  ).toBeVisible();

  // ארבעה קישורים אמיתיים — ולא radio-ים.
  await expect(path.getByRole("radio")).toHaveCount(0);
  await expect(path.locator(".path-station")).toHaveCount(4);
  for (const s of STAGES) {
    const card = path.locator(`a[href="${s.href}"]`);
    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible();
    await expect(card).toContainText(s.name);
  }

  // הכניסה הכנה למי שלא מזהה את עצמו: קישור אמיתי אל /compass (אותו מנוע),
  // בניסוח שאינו מבטיח שיחה חופשית.
  const complex = path.getByRole("link", { name: homePathUi.complexLabel });
  await expect(complex).toHaveAttribute("href", "/compass");
  await expect(path.getByText(homePathUi.complexPrompt)).toBeVisible();
});

for (const s of STAGES) {
  test(`clicking ${s.href} opens the listening conversation inline, seeded to its station (no navigation)`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });
    const path = page.locator("#path");

    await path.locator(`a[href="${s.href}"]`).click();

    // אין ניווט — נשארים בעמוד הבית.
    await expect(page).toHaveURL(/\/$/);
    // המנוע נפתח *במקום*, מדלג על „איפה אתם?” ומתחיל בדילמה (⇒ התחנה נזרעה נכון):
    const region = path.getByRole("region", { name: homePathUi.conversationLabel });
    await expect(region).toBeVisible();
    await expect(region.getByRole("heading", { name: askUi.dilemmaTitle })).toBeVisible();
    // פירור-הדרך מאשר את התחנה הספציפית שנבחרה.
    await expect(region.getByText(stationName(s.ask), { exact: true })).toBeVisible();
    // הכרטיסים התקפלו (לא נערמו מתחת לשיחה).
    await expect(path.locator(".path-station")).toHaveCount(0);

    // „חזרה לבחירת המצב” מחזיר את הכרטיסים.
    await path.getByRole("button", { name: homePathUi.backToPaths }).click();
    await expect(path.locator(".path-station")).toHaveCount(4);
    await expect(region).toHaveCount(0);
  });
}

test("the broad entry opens the guided engine from its start (station step), still no navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  await path.getByRole("link", { name: homePathUi.complexLabel }).click();
  await expect(page).toHaveURL(/\/$/);
  // המצב הרחב ביותר: המנוע נפתח בשלב בחירת-המצב, לא מדלג.
  const region = path.getByRole("region", { name: homePathUi.conversationLabel });
  await expect(region.getByRole("heading", { name: askUi.stationTitle })).toBeVisible();
});

test("keyboard: Tab reaches a card and Enter opens the inline conversation (no navigation)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator('#path a[href="/building-relationship"]');
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.locator("#path").getByRole("region", { name: homePathUi.conversationLabel }),
  ).toBeVisible();
});

test("no-JS: the cards and the complex entry are plain links and still navigate", async ({
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
  // הכניסה הרחבה גם היא קישור אמיתי (ל-/compass) ללא JS.
  await expect(path.getByRole("link", { name: homePathUi.complexLabel })).toHaveAttribute(
    "href",
    "/compass",
  );
  await Promise.all([
    page.waitForURL(/\/after-breakup$/),
    path.locator('a[href="/after-breakup"]').click(),
  ]);
  await ctx.close();
});

test("mobile 390: opening the inline conversation hides the floating bubble (no two competing entries)", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  // גוללים מעבר לסף החשיפה של הבועה, ומוודאים שהיא נוכחת לפני הפתיחה.
  await path.scrollIntoViewIfNeeded();
  const bubble = page.locator(".compass-pill");
  await expect(bubble).toHaveCSS("opacity", "1", { timeout: 4000 });

  // פתיחת השיחה במקום → הבועה נסוגה (אין שתי נקודות-כניסה שיחתיות במסך אחד).
  await path.locator('a[href="/inside-relationship"]').click();
  await expect(bubble).toHaveCSS("opacity", "0", { timeout: 4000 });
  await expect(bubble).toHaveCSS("pointer-events", "none");

  // חזרה → הבועה שבה.
  await path.getByRole("button", { name: homePathUi.backToPaths }).click();
  await expect(bubble).toHaveCSS("opacity", "1", { timeout: 4000 });
  await ctx.close();
});

test("mobile 390: a situation card is a large tap target and is not overlaid", async ({ browser }) => {
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
