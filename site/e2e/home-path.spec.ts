import { test, expect } from "./fixtures";

import { homePaths, homePathUi } from "../src/content/homePaths";

/**
 * „איפה אתם נמצאים עכשיו?” — **שכבת הניווט** של עמוד הבית.
 *
 * הקובץ הזה נכתב מחדש מול המבנה החדש, ולא הוחלש. מה שנפל כאן קודם, ולמה:
 *
 * הבדיקות הקודמות קיבעו זרימה של שלושה צעדים — תיבה שנראית כשדה-כתיבה, בחירת
 * מצב, כניסה ל-Focus Mode, ומשם „המשך אל השיחה”. הן שמרו עליה בקפידה: הן
 * אישרו שהתיבה נראית כמו שדה-כתיבה, שהיא מנווטת ל-/compass ללא JS, ושה-CTA
 * הסוגר קורא ל-callback. כלומר הן עברו במלואן גם כשהאפורדנס היה שקרי וגם
 * כשה-callback פתח שאלון נוסף — שני הליקויים החמורים ביותר שהאודיט מצא.
 *
 * מה שנשמר מהן במלואו: קישורים אמיתיים ללא JS, ניווט אמיתי, יעד-מגע ≥44px
 * ללא כיסוי, ומקלדת. מה שנוסף: אכיפה על *היעדר* אפורדנס מזויף, על היעדר
 * כניסה לשאלון מהזרימה הראשית, ועל כך שחמשת המצבים מוצגים כמודל שהמבקר
 * יפגוש שוב בעמוד-המסע.
 */

const STATIONS = homePaths.filter((p) => p.kind === "station");
const GATES = homePaths.filter((p) => p.kind === "gate");

test("#path: חמש נקודות-פתיחה, כולן `<a>` אמיתיים אל עמוד-המסע שלהן", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await path.scrollIntoViewIfNeeded();

  await expect(path.getByRole("heading", { name: homePathUi.heading })).toBeVisible();
  await expect(path.locator("a.situation-card")).toHaveCount(homePaths.length);

  for (const p of homePaths) {
    await expect(
      path.locator(`a.situation-card[href="${p.stationHref}"]`),
      `כרטיס ${p.id}`,
    ).toHaveCount(1);
  }
});

test("#path: מודל-המסע מוצג — שלוש תחנות ושני שערים, בשתי קבוצות מובחנות", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await path.scrollIntoViewIfNeeded();

  await expect(
    path.getByRole("heading", { name: homePathUi.stationsLabel }),
  ).toBeVisible();
  await expect(
    path.getByRole("heading", { name: homePathUi.gatesLabel }),
  ).toBeVisible();
  await expect(path.locator('[data-kind="station"] a.situation-card')).toHaveCount(
    STATIONS.length,
  );
  await expect(path.locator('[data-kind="gate"] a.situation-card')).toHaveCount(
    GATES.length,
  );
  // המודל שמוצג כאן הוא בדיוק זה שהמבקר יפגוש בעמוד-המסע.
  expect(STATIONS).toHaveLength(3);
  expect(GATES).toHaveLength(2);
});

test("#path: לחיצה אחת מגיעה לעמוד-המסע — אין שלב-ביניים ואין שאלון", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator('#path a.situation-card[href="/inside-relationship"]');
  await card.scrollIntoViewIfNeeded();
  await Promise.all([page.waitForURL(/\/inside-relationship$/), card.click()]);
  // הגענו לעמוד-המסע עצמו, לא לבמה כלשהי בתוך עמוד הבית.
  await expect(page.locator("h1")).toBeVisible();
});

test("#path: אין אפורדנס שמתחזה לשדה-קלט, ואין כניסה לשאלון מהזרימה הראשית", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await path.scrollIntoViewIfNeeded();

  await expect(path.locator("input, textarea")).toHaveCount(0);
  await expect(path.locator(".home-composer")).toHaveCount(0);
  await expect(path.locator('a[href="/compass"]')).toHaveCount(0);
});

test("no-JS: הכרטיסים הם קישורים רגילים ועדיין מנווטים", async ({ browser }) => {
  const ctx = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const path = page.locator("#path");
  for (const p of homePaths) {
    await expect(path.locator(`a.situation-card[href="${p.stationHref}"]`)).toHaveCount(1);
  }
  await Promise.all([
    page.waitForURL(/\/after-breakup$/),
    path.locator('a.situation-card[href="/after-breakup"]').click(),
  ]);
  await ctx.close();
});

test("מקלדת: Tab מגיע לכרטיס ו-Enter מנווט", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator('#path a.situation-card[href="/before-relationship"]');
  await card.scrollIntoViewIfNeeded();
  await card.focus();
  await expect(card).toBeFocused();
  await Promise.all([page.waitForURL(/\/before-relationship$/), page.keyboard.press("Enter")]);
});

test("mobile 390: יעד-מגע גדול, ואף שכבה אינה מכסה אותו", async ({ browser }) => {
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
  expect(hit.ok, `שכבה חוסמת את הכרטיס (top=${hit.tag})`).toBe(true);
  expect(hit.pe).not.toBe("none");
  await ctx.close();
});

test("mobile 390: המקטע אינו גורם לגלישה אופקית", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#path").scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await ctx.close();
});
