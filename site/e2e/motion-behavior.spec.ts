import { test, expect, type Page } from "@playwright/test";

/**
 * בדיקות-התנהגות לשפת-התנועה. הכלל כאן: מאשרים *מה שהמשתמש חווה* — מה זז,
 * מה נשאר גלוי, מה קורה במקלדת ומה קורה תחת תנועה-מופחתת — ולא שמות-מחלקות.
 * מחלקה יכולה להתקיים בזמן שהאפקט מת (וכך אכן קרה: פרלקסת-הדיוקן הוחלה על
 * אלמנט שאנימציה עם fill דרסה, והמחלקה הייתה שם בעוד ההיסט היה 0px).
 */

const consent = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      localStorage["cookie-consent"] = JSON.stringify({ necessary: true, ts: Date.now() });
    } catch {
      /* אין אחסון — הבאנר פשוט יופיע */
    }
  });
};

/** ממתין להתייצבות: כל האנימציות הסופיות סיימו. */
const settle = (page: Page) =>
  page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 450));
    const running = document
      .getAnimations()
      .filter((a) => a.playState === "running" && a.effect?.getTiming?.().iterations !== Infinity)
      .map((a) => a.finished.catch(() => {}));
    await Promise.race([Promise.all(running), new Promise((r) => setTimeout(r, 1500))]);
  });

test.describe("home — inline recognition and the travelling marker", () => {
  test("selecting a state keeps the cards, marks it, moves the marker and shows that state's copy", async ({
    page,
  }) => {
    await consent(page);
    await page.goto("/");
    await page.locator("#path").scrollIntoViewIfNeeded();
    await settle(page);

    const cards = page.locator("a.situation-card");
    await expect(cards).toHaveCount(4);

    await page.locator('a[data-index="0"]').click();
    await settle(page);

    // הכרטיסים נשארים — אין החלפת-תוכן חדה
    await expect(cards).toHaveCount(4);
    await expect(page.locator('a[data-index="0"]')).toHaveAttribute("aria-current", "true");

    const panel = page.locator(".path-recognition");
    await expect(panel).toBeVisible();
    const firstCopy = await panel.locator(".path-recognition__lead").innerText();
    expect(firstCopy.length).toBeGreaterThan(10);

    // הסמן יושב על הכרטיס הנבחר (מרכז מול מרכז)
    const markerCentre = async () => {
      const b = await page.locator(".path-marker").boundingBox();
      return b ? b.x + b.width / 2 : null;
    };
    const cardCentre = async (i: number) => {
      const b = await page.locator(`a[data-index="${i}"]`).boundingBox();
      return b ? b.x + b.width / 2 : null;
    };
    expect(Math.abs((await markerCentre())! - (await cardCentre(0))!)).toBeLessThan(4);

    // מעבר למצב אחר — הסמן נוסע והתוכן מתחלף במלואו
    await page.locator('a[data-index="2"]').click();
    await settle(page);
    expect(Math.abs((await markerCentre())! - (await cardCentre(2))!)).toBeLessThan(4);
    const secondCopy = await panel.locator(".path-recognition__lead").innerText();
    expect(secondCopy).not.toBe(firstCopy);
  });

  test("rapid reselection leaves no stale copy", async ({ page }) => {
    await consent(page);
    await page.goto("/");
    await page.locator("#path").scrollIntoViewIfNeeded();
    await settle(page);

    await page.locator('a[data-index="1"]').click();
    await page.locator('a[data-index="3"]').click();
    await page.locator('a[data-index="2"]').click();
    await settle(page);

    await expect(page.locator('a[data-index="2"]')).toHaveAttribute("aria-current", "true");
    // הכותרת חייבת להיות של המצב שנבחר אחרון — נגזרת מהכרטיס עצמו
    const chosen = await page.locator('a[data-index="2"] span').nth(1).innerText();
    expect(chosen.length).toBeGreaterThan(2);
    await expect(page.locator(".path-recognition")).toHaveCount(1);
  });

  test("keyboard can reach and activate a state", async ({ page }) => {
    await consent(page);
    await page.goto("/");
    await page.locator("#path").scrollIntoViewIfNeeded();
    await settle(page);
    await page.locator('a[data-index="0"]').focus();
    await page.keyboard.press("Enter");
    await settle(page);
    await expect(page.locator('a[data-index="0"]')).toHaveAttribute("aria-current", "true");
    await expect(page.locator(".path-recognition")).toBeVisible();
  });
});

test.describe("search → build", () => {
  test("starts scattered and ends constructed", async ({ page }) => {
    await consent(page);
    await page.goto("/");
    await settle(page);

    const spread = () =>
      page.evaluate(() => {
        const tops = [...document.querySelectorAll(".s2b__pt")].map(
          (e) => e.getBoundingClientRect().top,
        );
        return Math.round(Math.max(...tops) - Math.min(...tops));
      });

    // לפני הכניסה לתצוגה: הנקודות מפוזרות אנכית
    const top = await page.evaluate(
      () => Math.round(document.querySelector(".s2b")!.getBoundingClientRect().top + scrollY),
    );
    await page.evaluate(() => scrollTo({ top: 0, behavior: "auto" }));
    await page.waitForTimeout(300);
    await page.evaluate((y) => scrollTo({ top: y - 300, behavior: "auto" }), top);
    expect(await spread()).toBeGreaterThan(20); // פיזור אמיתי

    await settle(page);
    expect(await spread()).toBeLessThanOrEqual(1); // יישור מלא
    // והציר מחבר אותן
    const rail = await page.evaluate(
      () => getComputedStyle(document.querySelector(".s2b__rail")!).transform,
    );
    expect(rail).toMatch(/matrix\(1,/);
  });

  test("hash navigation does not stall", async ({ page }) => {
    await consent(page);
    const t0 = Date.now();
    await page.goto("/#path");
    await page.waitForTimeout(1200);
    expect(Date.now() - t0).toBeLessThan(12000);
    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(200);
  });
});

test.describe("peek inside", () => {
  const stack = ".peek__stack";

  test("below-threshold drag cancels; completed drag turns", async ({ page }) => {
    await consent(page);
    await page.goto("/book");
    await page.locator(".peek").scrollIntoViewIfNeeded();
    await settle(page);

    const label = () => page.locator(stack).getAttribute("aria-label");
    const before = await label();
    const box = (await page.locator(stack).boundingBox())!;

    // מתחת לסף — חוזר
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.68, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    await settle(page);
    expect(await label()).toBe(before);

    // מעל הסף — מתקדם
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 9 });
    await page.mouse.up();
    await settle(page);
    expect(await label()).not.toBe(before);

    // הגרירה תמיד מסתיימת במנוחה — אין מצב-ביניים שנשאר
    const drag = await page.evaluate(
      () => getComputedStyle(document.querySelector(".peek__stack")!).getPropertyValue("--peek-drag"),
    );
    expect(Number(drag)).toBe(0);
  });

  test("keyboard turns the leaf and only one leaf is ever exposed to assistive tech", async ({
    page,
  }) => {
    await consent(page);
    await page.goto("/book");
    await page.locator(".peek").scrollIntoViewIfNeeded();
    await settle(page);

    const exposed = () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll(".peek__leaf")].filter(
            (l) => !l.hasAttribute("aria-hidden") && !l.hasAttribute("inert"),
          ).length,
      );
    expect(await exposed()).toBe(1);

    const before = await page.locator(".peek__stack").getAttribute("aria-label");
    await page.locator(".peek__stack").focus();
    await page.keyboard.press("ArrowLeft"); // RTL: קדימה בקריאה
    await settle(page);
    expect(await page.locator(".peek__stack").getAttribute("aria-label")).not.toBe(before);
    expect(await exposed()).toBe(1);
  });
});

test.describe("reveals never strand content", () => {
  // סריקה מלאה של עמוד בן ~11,000px, הלוך *וחזור*, עם המתנה להתייצבות בכל
  // עצירה — זה פשוט לוקח יותר מ-30 שניות. ההארכה כאן היא בגלל *אורך הסריקה*
  // ולא כדי להסתיר מירוץ: הקביעה עצמה דטרמיניסטית (ריצה עצמאית מחזירה 0
  // באופן עקבי), הסף לא רוכך, והכיסוי לא צומצם.
  test.setTimeout(90_000);

  for (const route of ["/", "/book", "/preview", "/before-relationship"]) {
    test(`${route}: nothing meaningful is left invisible, and scrolling back does not re-hide`, async ({
      page,
    }) => {
      await consent(page);
      await page.goto(route);
      await settle(page);

      const worstHidden = await page.evaluate(async () => {
        const sel =
          ".reveal, .build-focus, .s2b__line, .quiet-demo__fact, .quiet-demo__story, .path-recognition, .peek__leaf[data-state='current']";
        const hidden = () => {
          const vh = innerHeight;
          return [...document.querySelectorAll(sel)].filter((e) => {
            const r = e.getBoundingClientRect();
            const inView = r.bottom > 8 && r.top < vh - 8 && r.width > 0 && r.height > 0;
            return inView && Number(getComputedStyle(e).opacity) < 0.99;
          }).length;
        };
        // צעד בגודל-מסך (ולא 700px קבוע): על עמוד בן ~11,000px זה ההבדל בין
        // סריקה שמסתיימת בזמן לבין timeout. הכיסוי זהה — כל פיקסל נראה פעם
        // אחת בירידה ופעם אחת בחזרה — רק מספר העצירות קטן. הבדיקה עצמה לא
        // הוחלשה: אותו סף (0.99) ואותו מעבר הלוך-ושוב.
        const H = document.body.scrollHeight;
        const step = Math.max(400, innerHeight - 80);
        const ys: number[] = [];
        for (let y = 0; y < H; y += step) ys.push(y);
        for (let i = ys.length - 1; i >= 0; i--) ys.push(ys[i]); // ירידה ואז חזרה
        let worst = 0;
        for (const y of ys) {
          scrollTo({ top: y, behavior: "auto" });
          await new Promise((r) => setTimeout(r, 380));
          const running = document
            .getAnimations()
            .filter((a) => a.playState === "running" && a.effect?.getTiming?.().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {}));
          await Promise.race([Promise.all(running), new Promise((r) => setTimeout(r, 900))]);
          worst = Math.max(worst, hidden());
        }
        return worst;
      });

      expect(worstHidden).toBe(0);
    });
  }
});

test.describe("reduced motion", () => {
  // הקשר ייעודי במקום test.use — כך ההעדפה חלה בוודאות על העמוד שנבדק,
  // ולא תלויה בהגדרת-פרויקט.
  test("search → build starts already constructed and nothing animates", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await consent(page);
    await page.goto(new URL("/", baseURL).toString());
    await page.locator(".s2b").scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);

    const state = await page.evaluate(() => {
      const tops = [...document.querySelectorAll(".s2b__pt")].map(
        (e) => e.getBoundingClientRect().top,
      );
      return {
        spread: Math.round(Math.max(...tops) - Math.min(...tops)),
        running: document.getAnimations().filter((a) => a.playState === "running").length,
        lineVisible: Number(getComputedStyle(document.querySelector(".s2b__line")!).opacity),
      };
    });
    expect(state.spread).toBeLessThanOrEqual(1);
    expect(state.running).toBe(0);
    expect(state.lineVisible).toBeGreaterThan(0.99);
    await ctx.close();
  });

  test("peek turns instantly and the author portrait does not drift", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await consent(page);
    await page.goto(new URL("/book", baseURL).toString());
    await page.locator(".peek").scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const before = await page.locator(".peek__stack").getAttribute("aria-label");
    await page.locator('.peek__btn[aria-label="העלה הבא"]').click();
    await page.waitForTimeout(120); // מיידי — בלי להמתין למעבר
    expect(await page.locator(".peek__stack").getAttribute("aria-label")).not.toBe(before);

    await page.goto(new URL("/author", baseURL).toString());
    await page.waitForTimeout(900);
    const travel = await page.evaluate(async () => {
      const el = document.querySelector(".portrait-parallax") as HTMLElement;
      const read = () => {
        const t = getComputedStyle(el).transform;
        return t === "none" ? 0 : Number(t.replace(/matrix\(|\)/g, "").split(",")[5]);
      };
      const H = document.documentElement.scrollHeight - innerHeight;
      let min = Infinity,
        max = -Infinity;
      for (let i = 0; i <= 6; i++) {
        scrollTo({ top: (H * i) / 6, behavior: "auto" });
        await new Promise((r) => setTimeout(r, 160));
        const v = read();
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
      return max - min;
    });
    expect(travel).toBe(0);
    await ctx.close();
  });
});
