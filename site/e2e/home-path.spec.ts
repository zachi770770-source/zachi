import { test, expect } from "./fixtures";

import { homePathUi } from "../src/content/homePaths";
import { askStations, askUi } from "../src/content/askRoute";
import { focusUi, getFocusSituation } from "../src/content/focusMode";

/**
 * „איפה אתם נמצאים עכשיו?” — מקטע-השיחה של עמוד הבית, מורכב כשיחה (לא כשאלון):
 * תיבת-כתיבה חופשית ראשית („ספרו לי מה קורה אצלכם…”), ומתחתיה ארבעה מצבים
 * מוכרים כפותחי-שיחה משניים.
 *
 * שכבת בסיס (SSR / ללא-JS / SEO): התיבה החופשית והכרטיסים נשארים `<a>` אמיתיים
 * — התיבה אל /compass, הכרטיסים אל עמודי-המסע. עם JS זהו שיפור-הדרגתי: לחיצה על
 * מצב-מוכר פותחת את Focus Mode (הבמה של „עובדה מול סיפור”) *במקום*, בלי ניווט,
 * ומשם ה-CTA ממשיך אל השיחה הדטרמיניסטית. הבועה הצפה מוסתרת במובייל כל עוד
 * המקטע במסך (אין שתי הזמנות מתחרות).
 */

const STAGES = [
  { id: "dating", name: /אני מחפש/, href: "/before-relationship", ask: "dating" },
  { id: "building", name: /אני בתחילת/, href: "/building-relationship", ask: "building" },
  { id: "existing", name: /אני בתוך/, href: "/inside-relationship", ask: "existing" },
  { id: "breakup", name: /אני אחרי/, href: "/after-breakup", ask: "after-breakup" },
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
  test(`clicking ${s.href} runs Focus Mode (fact vs story → Aha), then continues to the listening conversation, seeded to its station (no navigation)`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "networkidle" });
    const path = page.locator("#path");
    const sit = getFocusSituation(s.id);

    await path.locator(`a.situation-card[href="${s.href}"]`).click();
    await expect(page).toHaveURL(/\/$/);

    // פעימה 1 — enter: אזור-הבמה עולה עם כותרת-המצב; הכרטיסים התקפלו.
    const focus = path.getByRole("region", { name: focusUi.regionLabel });
    await expect(focus).toBeVisible();
    await expect(focus.getByRole("heading", { name: sit.title })).toBeVisible();
    await expect(path.locator(".situation-card")).toHaveCount(0);

    // enter → split: עובדה וסיפור *שניהם* גלויים (הפרדה ויזואלית), עם התוויות.
    await focus.getByRole("button", { name: focusUi.enterCta }).click();
    await expect(focus.getByText(sit.fact)).toBeVisible();
    await expect(focus.getByText(sit.story)).toBeVisible();
    await expect(focus.getByText(focusUi.factTag, { exact: true })).toBeVisible();
    await expect(focus.getByText(focusUi.storyTag, { exact: true })).toBeVisible();

    // split → aha: משפט-ההפרדה מופיע; הפעולה/CTA עדיין לא.
    await expect(focus.getByRole("button", { name: focusUi.continueLabel })).toHaveCount(0);
    await focus.getByRole("button", { name: focusUi.separateLabel }).click();
    await expect(focus.getByText(focusUi.separationLine)).toBeVisible();
    await expect(focus.getByRole("button", { name: focusUi.continueLabel })).toHaveCount(0);

    // aha → action: שלב נקי; „המשיכו עם הספר” → השיחה הדטרמיניסטית, seeded לתחנה.
    await focus.getByRole("button", { name: focusUi.ahaCta }).click();
    await expect(focus.getByText(sit.bridge)).toBeVisible();
    await focus.getByRole("button", { name: focusUi.continueLabel }).click();
    const region = path.getByRole("region", { name: homePathUi.conversationLabel });
    await expect(region).toBeVisible();
    await expect(region.getByRole("heading", { name: askUi.dilemmaTitle })).toBeVisible();
    await expect(region.getByText(stationName(s.ask), { exact: true })).toBeVisible();

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

test("keyboard: Tab reaches a situation starter and Enter opens Focus Mode (no navigation)", async ({
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
    page.locator("#path").getByRole("region", { name: focusUi.regionLabel }),
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

  // פתיחת Focus Mode — עדיין מוסתרת (data-ask-inline-active פעיל).
  await path.locator('a.situation-card[href="/inside-relationship"]').click();
  await expect(path.getByRole("region", { name: focusUi.regionLabel })).toBeVisible();
  await expect(bubble).toHaveCSS("opacity", "0", { timeout: 4000 });

  // סוגרים את הבמה וגוללים אל מעבר למקטע (תחתית העמוד) → הבועה חוזרת.
  await path.getByRole("button", { name: focusUi.backLabel }).click();
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

test("Focus Mode Aha: the story recedes (gone), the fact is affirmed, the separation line is the centerpiece, and the conversation CTA appears only at the clean action stage", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  const sit = getFocusSituation("existing");

  await path.locator('a.situation-card[href="/inside-relationship"]').click();
  const focus = path.getByRole("region", { name: focusUi.regionLabel });
  await expect(focus).toBeVisible();
  await focus.getByRole("button", { name: focusUi.enterCta }).click();
  await focus.getByRole("button", { name: focusUi.separateLabel }).click();

  // Aha: משפט-ההפרדה מרכזי, העובדה נשארת מאושרת, הסיפור נעלם, ועדיין אין CTA.
  await expect(focus.getByText(focusUi.separationLine)).toBeVisible();
  await expect(focus.getByText(sit.fact)).toBeVisible();
  await expect(focus.getByText(sit.story)).toHaveCount(0);
  await expect(focus.getByRole("button", { name: focusUi.continueLabel })).toHaveCount(0);

  // הפעולה נחשפת רק בשלב-הפעולה הנקי הבא.
  await focus.getByRole("button", { name: focusUi.ahaCta }).click();
  await expect(focus.getByRole("button", { name: focusUi.continueLabel })).toBeVisible();
});

test("mobile 390: the immersive Focus Mode stage never causes horizontal overflow, across every beat", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");

  await path.locator('a.situation-card[href="/before-relationship"]').click();
  const focus = path.getByRole("region", { name: focusUi.regionLabel });
  await expect(focus).toBeVisible();

  const noOverflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
  expect(await noOverflow(), "horizontal overflow at enter").toBe(true);

  await focus.getByRole("button", { name: focusUi.enterCta }).click();
  expect(await noOverflow(), "horizontal overflow at split").toBe(true);

  await focus.getByRole("button", { name: focusUi.separateLabel }).click();
  await expect(focus.getByText(focusUi.separationLine)).toBeVisible();
  expect(await noOverflow(), "horizontal overflow at aha").toBe(true);

  await focus.getByRole("button", { name: focusUi.ahaCta }).click();
  expect(await noOverflow(), "horizontal overflow at action").toBe(true);
  await ctx.close();
});
