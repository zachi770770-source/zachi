import { test, expect } from "./fixtures";

/**
 * חתימת ה-Hero: הקו מתחת ל„אהבה בונים.” ומעבר-האור על הכריכה.
 *
 * שני האפקטים נוספו כרגע-מותג *יחיד* בעמוד הבית. הבדיקות כאן מקבעות בדיוק את
 * מה שקל לשבור בלי לשים לב:
 *   1. ב-prefers-reduced-motion ה-Hero במצבו הסופי מיד — הקו מצויר, האור אינו
 *      מרונדר כלל, ואף אלמנט כניסה אינו מנפיש.
 *   2. מעבר-האור הוא opt-in: הוא קיים בכריכת ה-Hero בלבד ולא בשאר מופעי
 *      הכריכה באתר (/book, /author, הטעימה).
 *   3. הקו הוא שכבה מוחלטת ⇒ אינו משנה את גובה הכותרת (ללא CLS).
 *   4. במגע אין הטיה, ובמקלדת קישור הכריכה נשאר בר-מיקוד.
 */

const STROKE = ".hero-build__stroke";
const SHEEN = ".book-cover__sheen";

test.describe("Hero signature", () => {
  test("reduced-motion: the stroke is drawn, the light sweep is not rendered, nothing animates", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // כמעט מיד — לפני שאנימציה כלשהי הייתה מספיקה לרוץ.
    const state = await page.evaluate(
      ({ stroke, sheen }) => {
        const cs = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? getComputedStyle(el) : null;
        };
        const s = cs(stroke);
        const sh = cs(sheen);
        const entrance = [".hero-line__in", ".hero-rule", ".hero-build", ".hero-book"].map((sel) => ({
          sel,
          anim: cs(sel)?.animationName ?? "missing",
          opacity: cs(sel)?.opacity ?? "missing",
        }));
        return {
          strokeAnim: s?.animationName,
          strokeTransform: s?.transform,
          strokeVisible: s ? s.display !== "none" && Number(s.opacity) > 0.9 : false,
          sheenDisplay: sh?.display,
          entrance,
        };
      },
      { stroke: STROKE, sheen: SHEEN },
    );

    // הקו הוא עיצוב, לא תנועה: הוא נשאר מצויר במלואו.
    expect(state.strokeAnim).toBe("none");
    expect(state.strokeVisible).toBe(true);
    expect(state.strokeTransform).toBe("matrix(1, 0, 0, 1, 0, 0)"); // scaleX(1)
    // האור הוא תנועה טהורה: בלי אנימציה הוא רק שארית, ולכן אינו מרונדר.
    expect(state.sheenDisplay).toBe("none");
    // שום אלמנט כניסה אינו מנפיש, וכולם גלויים.
    for (const e of state.entrance) {
      expect(e.anim, `${e.sel} must not animate`).toBe("none");
      expect(Number(e.opacity), `${e.sel} must be visible`).toBeGreaterThan(0.9);
    }
    await ctx.close();
  });

  test("the light sweep is opt-in: only the Hero cover has it", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(SHEEN)).toHaveCount(1);
    // הוא יושב בתוך כריכת ה-Hero, לא במקום אחר בעמוד.
    expect(await page.locator(`.hero-book ${SHEEN}`).count()).toBe(1);

    for (const route of ["/book", "/author", "/preview"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(await page.locator(SHEEN).count(), `${route} must not carry the sweep`).toBe(0);
    }
  });

  test("the stroke does not change the headline's height (no layout cost)", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const measured = await page.evaluate((sel) => {
      const stroke = document.querySelector<HTMLElement>(sel);
      const build = stroke?.parentElement;
      const h1 = document.querySelector("h1");
      if (!stroke || !build || !h1) return null;
      const before = h1.getBoundingClientRect().height;
      stroke.style.display = "none";
      const without = h1.getBoundingClientRect().height;
      stroke.style.display = "";
      return { before, without, position: getComputedStyle(stroke).position };
    }, STROKE);
    expect(measured).not.toBeNull();
    expect(measured!.position).toBe("absolute");
    expect(measured!.before).toBeCloseTo(measured!.without, 1);
  });

  test("touch: the cover never tilts", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2400);
    const tilt = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".book-tilt");
      if (!el) return null;
      return {
        x: el.style.getPropertyValue("--tilt-x"),
        y: el.style.getPropertyValue("--tilt-y"),
      };
    });
    // או שאין כריכה ברוחב הזה, או שיש ואיש לא הטה אותה.
    if (tilt) {
      expect(tilt.x).toBe("");
      expect(tilt.y).toBe("");
    }
    await ctx.close();
  });

  test("the cover link stays reachable and focusable by keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const link = page.locator(".hero-book__link");
    await expect(link).toHaveCount(1);
    await link.focus();
    await expect(link).toBeFocused();
    // האור דקורטיבי ואינו לוכד אירועים.
    expect(await page.locator(SHEEN).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
  });

  test("no horizontal overflow at any width", async ({ page }) => {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2400); // אחרי שכל הכניסה נחה
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflows, `horizontal overflow at ${width}px`).toBe(false);
    }
  });
});
