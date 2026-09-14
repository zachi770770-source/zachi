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

test("Hero: המסר נוחת לפני הספר, וה-CTA אחרון", async ({ page }) => {
  await page.goto(HOME, { waitUntil: "commit" });
  const order: { t: number; build: number; book: number; cta: number }[] = [];
  for (let i = 0; i < 8; i += 1) {
    await page.waitForTimeout(180);
    order.push(
      await page.evaluate(() => {
        const o = (s: string) => {
          const el = document.querySelector(s);
          return el ? Number(getComputedStyle(el).opacity) : 0;
        };
        const gl = document.querySelector('.hero-bookgl[data-active="true"]');
        return {
          t: performance.now(),
          build: o(".sig-hero__build"),
          book: gl ? Number(getComputedStyle(gl).opacity) : o(".sig-hero__cover"),
          cta: o(".sig-hero__cta"),
        };
      })
    );
  }
  const firstAt = (k: "build" | "book" | "cta") => {
    const hit = order.find((s) => s[k] > 0.5);
    return hit ? hit.t : Number.POSITIVE_INFINITY;
  };
  // הכותרת נוחתת לא אחרי הספר, והספר לא אחרי ה-CTA. אי-שוויון רפה בכוונה:
  // הטענה היא על *סדר*, לא על מספרים.
  expect(firstAt("build")).toBeLessThanOrEqual(firstAt("book"));
  expect(firstAt("book")).toBeLessThanOrEqual(firstAt("cta"));
  // והכול מסתיים גלוי.
  const last = order[order.length - 1];
  expect(Math.min(last.build, last.book, last.cta)).toBeGreaterThan(0.9);
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
