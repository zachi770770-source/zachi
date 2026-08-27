import { test, expect } from "./fixtures";

import { homePathUi } from "../src/content/homePaths";
import { askStations, askUi } from "../src/content/askRoute";

/**
 * „איפה אתם נמצאים עכשיו?” — מקטע-השיחה של עמוד הבית, מורכב כשיחה (לא כשאלון):
 * תיבת-כתיבה חופשית ראשית („ספרו לי מה קורה אצלכם…”), ומתחתיה ארבעה מצבים
 * מוכרים כפותחי-שיחה משניים.
 *
 * שכבת בסיס (SSR / ללא-JS / SEO): התיבה החופשית והכרטיסים נשארים `<a>` אמיתיים
 * — התיבה אל /compass, הכרטיסים אל עמודי-המסע. עם JS זהו שיפור-הדרגתי: לחיצה
 * פותחת את מנוע „שאל את הספר” *במקום*, בלי ניווט. הבועה הצפה מוסתרת במובייל כל
 * עוד המקטע במסך (אין שתי הזמנות מתחרות).
 */

const STAGES = [
  { name: /אני מחפש/, href: "/before-relationship", ask: "dating" },
  { name: /אני בתחילת/, href: "/building-relationship", ask: "building" },
  { name: /אני בתוך/, href: "/inside-relationship", ask: "existing" },
  { name: /אני אחרי/, href: "/after-breakup", ask: "after-breakup" },
] as const;

const stationName = (askId: string) =>
  askStations.find((s) => s.id === askId)!.name;

test("#path: the primary composer entry (guided affordance by default) + four situation starters — real links (SEO/no-JS)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await expect(path.getByRole("heading", { name: homePathUi.heading })).toBeVisible();
  await expect(path.getByText(homePathUi.eyebrow)).toBeVisible();

  // נקודת-הכניסה הראשית: קישור אמיתי אל /compass (ללא JS), עם כיתוב מזמין.
  const composer = path.getByRole("link", { name: homePathUi.composerAriaLabel });
  await expect(composer).toHaveAttribute("href", "/compass");
  await expect(path.getByText(homePathUi.composerLead)).toBeVisible();
  // בברירת המחדל (המצפן המודרך בלבד — סביבת הבדיקה) האפורדנס כן: אין סמן-כתיבה
  // מהבהב שמבטיח הקלדה, והרמז מתאר את המהלך המודרך. סמן-הכתיבה שמור למצב שבו
  // הכתיבה-החופשית באמת חיה.
  await expect(path.getByText(homePathUi.composerHintGuided)).toBeVisible();
  await expect(path.locator(".home-composer__caret")).toHaveCount(0);

  // מפריד אל המצבים המשניים.
  await expect(path.getByText(homePathUi.startersLabel)).toBeVisible();

  // ארבעה פותחי-שיחה — קישורים אמיתיים, ולא radio-ים.
  await expect(path.getByRole("radio")).toHaveCount(0);
  await expect(path.locator(".situation-card")).toHaveCount(4);
  for (const s of STAGES) {
    const card = path.locator(`a.situation-card[href="${s.href}"]`);
    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible();
    await expect(card).toContainText(s.name);
  }
});

for (const s of STAGES) {
  test(`clicking ${s.href} opens the listening conversation inline, seeded to its station (no navigation)`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });
    const path = page.locator("#path");

    await path.locator(`a.situation-card[href="${s.href}"]`).click();

    await expect(page).toHaveURL(/\/$/);
    const region = path.getByRole("region", { name: homePathUi.conversationLabel });
    await expect(region).toBeVisible();
    await expect(region.getByRole("heading", { name: askUi.dilemmaTitle })).toBeVisible();
    await expect(region.getByText(stationName(s.ask), { exact: true })).toBeVisible();
    // המצבים התקפלו (לא נערמו מתחת לשיחה).
    await expect(path.locator(".situation-card")).toHaveCount(0);

    await path.getByRole("button", { name: homePathUi.backToPaths }).click();
    await expect(path.locator(".situation-card")).toHaveCount(4);
    await expect(region).toHaveCount(0);
  });
}

test("the free-text composer opens the guided engine from its start (station step), still no navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  await path.getByRole("link", { name: homePathUi.composerAriaLabel }).click();
  await expect(page).toHaveURL(/\/$/);
  const region = path.getByRole("region", { name: homePathUi.conversationLabel });
  await expect(region.getByRole("heading", { name: askUi.stationTitle })).toBeVisible();
});

test("keyboard: Tab reaches a situation starter and Enter opens the inline conversation (no navigation)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator('#path a.situation-card[href="/building-relationship"]');
  await card.focus();
  await expect(card).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.locator("#path").getByRole("region", { name: homePathUi.conversationLabel }),
  ).toBeVisible();
});

test("no-JS: the composer and the situation starters are plain links and still navigate", async ({
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
    await expect(path.locator(`a.situation-card[href="${s.href}"]`)).toHaveCount(1);
  }
  // התיבה החופשית גם היא קישור אמיתי (ל-/compass) ללא JS.
  await expect(path.getByRole("link", { name: homePathUi.composerAriaLabel })).toHaveAttribute(
    "href",
    "/compass",
  );
  await Promise.all([
    page.waitForURL(/\/after-breakup$/),
    path.locator('a.situation-card[href="/after-breakup"]').click(),
  ]);
  await ctx.close();
});

test("mobile 390: the floating bubble is suppressed while #path is in view, and returns after leaving it", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  const bubble = page.locator(".compass-pill");

  // המקטע במסך → הבועה נסוגה (אין שתי הזמנות מתחרות לדבר עם הספר).
  await path.scrollIntoViewIfNeeded();
  await expect(bubble).toHaveCSS("opacity", "0", { timeout: 4000 });
  await expect(bubble).toHaveCSS("pointer-events", "none");

  // פתיחת שיחה — עדיין מוסתרת.
  await path.locator('a.situation-card[href="/inside-relationship"]').click();
  await expect(bubble).toHaveCSS("opacity", "0", { timeout: 4000 });

  // סוגרים את השיחה וגוללים אל מעבר למקטע (תחתית העמוד) → הבועה חוזרת.
  await path.getByRole("button", { name: homePathUi.backToPaths }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(bubble).toHaveCSS("opacity", "1", { timeout: 4000 });
  await ctx.close();
});

test("mobile 390: a situation starter is a large tap target and is not overlaid", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator('#path a.situation-card[href="/after-breakup"]');
  await card.scrollIntoViewIfNeeded();

  const box = await card.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  const hit = await page.evaluate(() => {
    const a = document.querySelector('#path a.situation-card[href="/after-breakup"]');
    if (!a) return { ok: false, tag: "MISSING", pe: "n/a" };
    const r = a.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      ok: !!top && (top === a || a.contains(top)),
      tag: top ? top.tagName : "null",
      pe: top ? getComputedStyle(top).pointerEvents : "none",
    };
  });
  expect(hit.ok, `overlay intercepts the situation starter (top=${hit.tag})`).toBe(true);
  expect(hit.pe).not.toBe("none");
  await ctx.close();
});
