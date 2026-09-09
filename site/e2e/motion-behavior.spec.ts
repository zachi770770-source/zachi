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

/**
 * הבחירה-במקום והסמן-הנוסע הוסרו יחד עם השלב שהם שירתו: כרטיס-מצב הוא עכשיו
 * קישור, ולחיצה עליו מנווטת. הבדיקות שקיבעו את אותו שלב-ביניים הוחלפו בטענה
 * ההתנהגותית שנכונה עכשיו — ושהיא חזקה יותר, כי היא מאמתת ניווט אמיתי ולא
 * שינוי-מחלקה.
 */
test.describe("home — כרטיסי-המצב מנווטים", () => {
  test("לחיצה על כרטיס מגיעה לעמוד-המסע, בלי שלב-ביניים", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const card = page.locator('#path a.situation-card[href="/inside-relationship"]');
    await card.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/inside-relationship$/), card.click()]);
  });

  test("מקלדת: פוקוס על כרטיס ו-Enter מנווטים", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const card = page.locator('#path a.situation-card[href="/after-breakup"]');
    await card.scrollIntoViewIfNeeded();
    await card.focus();
    await expect(card).toBeFocused();
    await Promise.all([page.waitForURL(/\/after-breakup$/), page.keyboard.press("Enter")]);
  });
});

/**
 * סצנת „מחיפוש לבנייה” הוסרה מעמוד הבית: נמדד שהיא מתייצבת מחוץ למסך וברוב
 * הגלילות נראית כשורת-כיתוב ותשע נקודות, וכן שהיא כפילות חלשה של סצנת-התזה
 * ב-/book (שנשארת ונבדקת שם). לכן שתי הטענות על פיזור→מבנה ירדו יחד איתה.
 * מה שנשמר: השמירה שניווט-hash אינו נתקע — היא לא הייתה על הסצנה אלא על
 * העמוד כולו.
 */
test.describe("home — ניווט", () => {
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
          ".reveal, .build-focus, .quiet-demo__fact, .quiet-demo__story, .peek__leaf[data-state='current']";
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
  // (הוסר) — סצנת „מחיפוש לבנייה” אינה קיימת עוד בעמוד הבית.

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
