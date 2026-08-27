import { test, expect } from "./fixtures";

/**
 * חתימת ה-Hero: הקו הנמשך מתחת ל„אהבה בונים.”.
 *
 * הבדיקות מקבעות בדיוק את מה שקל לשבור בלי לשים לב:
 *   1. ב-prefers-reduced-motion ה-Hero במצבו הסופי מיד — הקו מצויר ואף אלמנט
 *      כניסה אינו מנפיש.
 *   2. הקו הוא שכבה מוחלטת ⇒ אינו משנה את גובה הכותרת (ללא CLS).
 *   3. במגע אין הטיה, ובמקלדת קישור הכריכה נשאר בר-מיקוד.
 */

const STROKE = ".sig-hero__stroke";

test.describe("Hero signature", () => {
  test("reduced-motion: the stroke is drawn and nothing animates", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // כמעט מיד — לפני שאנימציה כלשהי הייתה מספיקה לרוץ.
    const state = await page.evaluate(
      (stroke) => {
        const cs = (sel: string) => {
          const el = document.querySelector(sel);
          return el ? getComputedStyle(el) : null;
        };
        const s = cs(stroke);
        const entrance = [".sig-hero__eyebrow", ".sig-hero__build", ".sig-hero__cover"].map((sel) => ({
          sel,
          anim: cs(sel)?.animationName ?? "missing",
          opacity: cs(sel)?.opacity ?? "missing",
        }));
        return {
          strokeAnim: s?.animationName,
          strokeTransform: s?.transform,
          strokeVisible: s ? s.display !== "none" && Number(s.opacity) > 0.9 : false,
          entrance,
        };
      },
      STROKE,
    );

    // הקו הוא עיצוב, לא תנועה: הוא נשאר מצויר במלואו.
    expect(state.strokeAnim).toBe("none");
    expect(state.strokeVisible).toBe(true);
    expect(state.strokeTransform).toBe("matrix(1, 0, 0, 1, 0, 0)"); // scaleX(1)
    // שום אלמנט כניסה אינו מנפיש, וכולם גלויים.
    for (const e of state.entrance) {
      expect(e.anim, `${e.sel} must not animate`).toBe("none");
      expect(Number(e.opacity), `${e.sel} must be visible`).toBeGreaterThan(0.9);
    }
    await ctx.close();
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
    const link = page.locator(".sig-hero__cover-link");
    await expect(link).toHaveCount(1);
    await link.focus();
    await expect(link).toBeFocused();
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
