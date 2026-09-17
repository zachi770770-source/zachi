import { test, expect } from "@playwright/test";

/**
 * סבב-התנועה של עמוד הבית. הבדיקות כאן שומרות על *התנהגות* שנמדדה כשבורה
 * לפני הסבב — לא על ערכי-תזמון ספציפיים, כדי שכיוונון עתידי של משך או easing
 * לא יישבר כאן אלא רק אם התנועה עצמה נעלמת.
 *
 * מה נמדד לפני, ולמה זו רגרסיה אמיתית:
 *   • שלושה מקטעים נכנסו בלי שום תנועה (גשר-הטעימה, הדלת אל המצפן, וחמש
 *     הבחירות שנחשפו כגוש אחד).
 *   • ביט-הזיהוי נחשף ב-scrollY=0 כשראשו 36px *מתחת* לקיפול — הכוריאוגרפיה
 *     רצה מחוץ למסך.
 *   • ספר-ה-WebGL הופיע במתג `display` בלי כניסה, ולפני שהכותרת נחתה.
 */

const HOME = "/";

async function parkAbove(page: import("@playwright/test").Page, sel: string) {
  const box = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    return { top: el.getBoundingClientRect().top + window.scrollY, vh: window.innerHeight };
  }, sel);
  if (!box) throw new Error(`missing ${sel}`);
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, box.top - box.vh * 1.6));
  await page.waitForTimeout(350);
  return box;
}

test("חמש הבחירות נכנסות בזו-אחר-זו, לא בבת אחת", async ({ page }) => {
  await page.goto(HOME, { waitUntil: "networkidle" });
  const box = await parkAbove(page, ".path-rows");
  await expect(page.locator(".path-rows")).not.toHaveClass(/is-visible/);

  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, box.top - box.vh * 0.5));

  // בתוך חלון-הכניסה חייבות להימדד לפחות שתי אטימויות שונות בין חמש השורות:
  // זו ההגדרה התפעולית של „סטגר”, ואינה תלויה במשך או ב-easing.
  let distinct = 0;
  for (let i = 0; i < 12 && distinct < 2; i += 1) {
    await page.waitForTimeout(60);
    distinct = await page.evaluate(() => {
      const o = [...document.querySelectorAll("#path li")].map((el) =>
        Number(getComputedStyle(el).opacity).toFixed(2)
      );
      return new Set(o).size;
    });
  }
  expect(distinct, "חמש השורות הופיעו באותו רגע").toBeGreaterThan(1);

  // ובסוף — כולן גלויות לחלוטין.
  await page.waitForTimeout(1200);
  const finalOpacity = await page.evaluate(() =>
    [...document.querySelectorAll("#path li")].map((el) => Number(getComputedStyle(el).opacity))
  );
  expect(Math.min(...finalOpacity)).toBeGreaterThan(0.98);
});

test("גשר-הטעימה והדלת אל המצפן נכנסים בתנועה (ולא סטטיים)", async ({ page }) => {
  for (const sel of [".sample-bridge__inner", ".deeper-entry--home"]) {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const box = await parkAbove(page, sel);
    await expect(page.locator(sel)).not.toHaveClass(/is-visible/);
    await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, box.top - box.vh * 0.5));
    await page.waitForTimeout(900);
    await expect(page.locator(sel)).toHaveClass(/is-visible/);
  }
});

test("ביט-הזיהוי נחשף רק כשהוא באמת בתצוגה — לא מחוץ למסך", async ({ page }) => {
  await page.goto(HOME, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => {
    const el = document.querySelector(".recog");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { visible: el.classList.contains("is-visible"), top: r.top, vh: window.innerHeight };
  });
  expect(state).not.toBeNull();
  // אם הוא נחשף — ראשו חייב להיות בתוך אזור-הצפייה. חשיפה בזמן שהוא מתחת
  // לקיפול פירושה שהאנימציה רצה כשאיש לא רואה אותה.
  if (state!.visible) {
    expect(state!.top, "נחשף בעודו מתחת לקיפול").toBeLessThan(state!.vh);
  }
});

test("רגע-המחבר: הדיוקן והטקסט נכנסים בנפרד", async ({ page }) => {
  await page.goto(HOME, { waitUntil: "networkidle" });
  const box = await parkAbove(page, ".author-note");
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, box.top - box.vh * 0.5));

  let apart = false;
  for (let i = 0; i < 12 && !apart; i += 1) {
    await page.waitForTimeout(60);
    apart = await page.evaluate(() => {
      const p = document.querySelector(".author-note__portrait");
      const t = document.querySelector(".author-note__text");
      if (!p || !t) return false;
      return (
        Math.abs(
          Number(getComputedStyle(p).opacity) - Number(getComputedStyle(t).opacity)
        ) > 0.1
      );
    });
  }
  expect(apart, "הדיוקן והטקסט נכנסו כגוש אחד").toBe(true);
});

test("Hero: הפעולה אחרונה, והספר אינו ממתין לטקסט", async ({ page }) => {
  await page.goto(HOME, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // נמדד מתוך התזמון המוצהר ולא מדגימת-אטימות: דגימה תלוית-תזמון החזירה
  // לסירוגין שוויון בין שתי דגימות סמוכות, והטענה על *סדר* הפכה לרעש.
  // כאן הטענה נבדקת על מקור-האמת — ההשהיות עצמן — ולכן היא דטרמיניסטית.
  const t = await page.evaluate(() => {
    const delay = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const d = getComputedStyle(el).animationDelay.split(",")[0].trim();
      return d.endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000;
    };
    const canvas = document.querySelector(
      '.hero-bookgl[data-active="true"] .hero-bookgl__canvas'
    );
    return {
      eyebrow: delay(".sig-hero__eyebrow"),
      build: delay(".sig-hero__build"),
      cta: delay(".sig-hero__cta"),
      bookCanvas: canvas ? delay('.hero-bookgl[data-active="true"] .hero-bookgl__canvas') : null,
      bookActive: !!canvas,
    };
  });

  expect(t.eyebrow, "כותרת-העל חסרה").not.toBeNull();
  // הפעולה אחרונה — אחרי הכותרת ואחרי כותרת-העל.
  expect(t.cta!).toBeGreaterThan(t.build!);
  expect(t.build!).toBeGreaterThan(t.eyebrow!);

  // הספר: כשה-GL רץ, הכניסה שלו היא תלת-ממדית ומתחילה מיד — הקנבס עצמו רק
  // נמוג פנימה בלי השהיה. כלומר הספר אינו „ממתין” לסיום בניית הכותרת.
  if (t.bookActive) {
    expect(t.bookCanvas!).toBeLessThan(t.build!);
  }

  // והכול מגיע למצב סופי גלוי.
  await page.waitForTimeout(2200);
  const visible = await page.evaluate(() => {
    const o = (s: string) => {
      const el = document.querySelector(s);
      return el ? Number(getComputedStyle(el).opacity) : 0;
    };
    const gl = document.querySelector('.hero-bookgl[data-active="true"] .hero-bookgl__canvas');
    return {
      build: o(".sig-hero__build"),
      cta: o(".sig-hero__cta"),
      book: gl ? Number(getComputedStyle(gl).opacity) : o(".sig-hero__cover"),
    };
  });
  expect(Math.min(visible.build, visible.cta, visible.book)).toBeGreaterThan(0.9);
});

test("תנועה-מופחתת: כל התוכן גלוי מיד, בלי תלות באנימציה", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  // `motion-js` לא נוסף כלל ⇒ שום כלל-הסתרה אינו חל.
  await expect(page.locator("html")).not.toHaveClass(/motion-js/);

  const hidden = await page.evaluate(() => {
    const targets = [
      ".path-rows",
      "#path li",
      ".sample-bridge__line",
      ".sample-bridge__cta",
      ".deeper-entry--home",
      ".author-note__portrait",
      ".author-note__text",
      ".s2p__station",
      ".sig-close__title",
    ];
    const out: string[] = [];
    for (const sel of targets) {
      document.querySelectorAll(sel).forEach((el) => {
        if (Number(getComputedStyle(el).opacity) < 0.99) out.push(sel);
      });
    }
    return out;
  });
  expect(hidden, `אלמנטים נסתרים תחת תנועה-מופחתת: ${hidden.join(", ")}`).toEqual([]);
  await ctx.close();
});

test("מובייל 390: אין גלישה אופקית בשום שלב של הכניסות", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: "networkidle" });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 300) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(90);
    const over = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1
    );
    expect(over, `גלישה אופקית ב-scrollY=${y}`).toBe(false);
  }
  await ctx.close();
});
