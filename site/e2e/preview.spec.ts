import { test, expect } from "./fixtures";

/**
 * עמוד ההצצה (/preview) — נפתח מיד ללא אימייל, חוויית קריאה ספרותית עם „דפדוף”
 * בין החלקים, מעבר למצפן, CTA דביק במובייל שאינו מכסה טופס/פוטר, ורשימת המתנה
 * עם מצבי הצלחה/כשל. אין רכישה/מחיר/checkout.
 */

test("/preview opens immediately (no email gate) with the reading experience", async ({ page }) => {
  const res = await page.goto("/preview", { waitUntil: "networkidle" });
  expect(res?.status()).toBe(200);
  // הקטע נקרא מיד — אין קיר הרשמה.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "התקדמות הקריאה" })).toHaveCount(1);
  // עוגן מעבר הכריכה מה-Hero קיים ביעד.
  await expect(page.locator("[data-vt-book-dest]")).toHaveCount(1);
  // גוף הקריאה גלוי בפועל (סטטי, בלי מנגנון-חשיפה שיכול להשאיר opacity:0).
  const lead = page.locator(".living-ink .reader-lead");
  await expect(lead).toBeVisible();
  await expect(lead).toHaveCSS("opacity", "1");
});

test("/preview renders the canonical book excerpt continuously (opening + closing visible, no CTA inside)", async ({
  page,
}) => {
  await page.goto("/preview", { waitUntil: "networkidle" });

  const reading = page.locator('section[aria-labelledby="canonical-reading-heading"]');
  await expect(reading).toHaveCount(1);

  // מסגור עריכתי: שם המקטע מהמבוא + זמן קריאה אמיתי (לא בלוק שיווקי).
  await expect(reading.getByRole("heading", { name: "החלק השני של האהבה" })).toBeVisible();

  // משפט-הפתיחה ומשפט-הסיום גלויים בפועל — הקטע רציף, בלי read-more/קיפול/קטיעה.
  await expect(
    reading.getByText(/מאוחר מדי, בכמה קשרים שכבר לא יכולתי להציל/),
  ).toBeVisible();
  await expect(
    reading.getByText(/אלא כשבונים קשר שיש בו אמת ונוכחות\.$/),
  ).toBeVisible();

  // תשע פסקאות רצופות מרונדרות במלואן.
  await expect(reading.locator("p.font-serif")).toHaveCount(9);

  // אין שום CTA רכישה/אמזון בתוך חוויית הקריאה עצמה — הרכישה באה אחריה.
  await expect(reading.locator('a[href*="amazon"]')).toHaveCount(0);
  await expect(reading.locator("a")).toHaveCount(0);

  // עדיין H1 יחיד בעמוד (הקריאה הקנונית היא h2).
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("/preview has a clear transition to the compass and buys via Amazon (no local checkout)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  await expect(page.locator('a[href="/compass"]').first()).toBeVisible();
  // הרכישה עוברת לאמזון (חיצוני) — לא checkout מקומי.
  await expect(page.locator('a[href*="amazon.com/dp/B0GJ3SL9H2"]').first()).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test("/preview mobile: רק סרגל-הקורא והמשגר המאושר מרחפים — שום שכבה אחרת", async ({
  browser,
}) => {
  // ── היסטוריה של הטענה הזו, כדי שלא תתהפך שוב בטעות ───────────────────────
  // גלגול 1: הבדיקה שמרה על בר-CTA דביק בתוך עמוד-הקריאה.
  // גלגול 2: הבר הוסר, יחד עם בועת-המצפן, והטענה התהפכה ל„אין שום בקרה צפה”.
  //          הניסוח הראשון היה רחב מדי ותפס גם את סרגל-הקורא, שהוא פקדי
  //          חוויית-הקריאה ולא CTA מתחרה, ולכן הוחרג במפורש.
  // גלגול 3 (כאן): דרישת-המוצר השתנתה — „שאל את הספר” נדרש בכל עמוד עברי
  //          ציבורי, ‎/preview‎ בכלל זה וגם במובייל. הדרישה הנוכחית גוברת על
  //          הטענה הקודמת, ולכן היא עודכנה **במכוון**, לא הוחלשה כדי לעבור.
  //
  // האינווריאנט החדש, והוא עדיין הדוק: ב-‎/preview‎ במובייל מותרים בדיוק
  // ההדר, סרגל-הקורא, והמשגר המאושר — ושום שכבה צפה אחרת, בכל מיקום-גלילה.
  // שתי השכבות שהוסרו בגלגול 2 עדיין אסורות במפורש בסוף הבדיקה.
  //
  // אין כאן התנגשות גיאומטרית: סרגל-הקורא הוא ‎sticky‎ בראש המסך
  // (‎top: var(--header-height)‎) והמשגר ‎fixed‎ בתחתיתו. אי-החפיפה נטענת למטה
  // כמדידת-מלבנים, ולא כהנחה.
  const LAUNCHER = "שאל את הספר";
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // הסכמת-העוגיות היא השכבה הצפה היחידה שמותרת באתר, והיא מופיעה במובייל
  // אחרי השהיה — כלומר לחיצה חד-פעמית בתחילת הבדיקה אינה אמינה. מציבים את
  // ההסכמה מראש כדי למדוד את המצב היציב: מבקר שכבר החליט, וקורא.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem(
        "cookie-consent",
        JSON.stringify({ necessary: true, analytics: true, marketing: true }),
      );
    } catch {}
  });
  const page = await ctx.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview", { waitUntil: "networkidle" });

  for (const frac of [0, 0.35, 0.7, 1]) {
    await page.evaluate((f) => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.body.scrollHeight * f);
    }, frac);
    await page.waitForTimeout(250);
    const floats = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.position !== "fixed" && cs.position !== "sticky") return false;
          if (cs.visibility === "hidden" || cs.opacity === "0") return false;
          const r = el.getBoundingClientRect();
          if (r.width < 40 || r.height < 20) return false;
          if (el.closest("header") || el.closest(".reader-toolbar")) return false;
          // המשגר המאושר — שכבה צפה מותרת, ורק היא.
          if (el.closest('a[href="/compass"][title="שאל את הספר"]')) return false;
          return true;
        })
        .map((el) => el.tagName + "." + String(el.className).slice(0, 40)),
    );
    expect(floats, `floating layers at ${frac * 100}% of /preview`).toEqual([]);

    // המשגר באמת שם, ואינו חופף לסרגל-הקורא — מדידת-מלבנים, לא הנחה.
    const boxes = await page.evaluate(() => {
      const box = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height };
      };
      return {
        launcher: box(document.querySelector('a[href="/compass"][title="שאל את הספר"]')),
        toolbar: box(document.querySelector(".reader-toolbar")),
      };
    });
    expect(boxes.launcher, `launcher missing at ${frac * 100}%`).not.toBeNull();
    const l = boxes.launcher!;
    const t = boxes.toolbar;
    if (t && t.h > 0) {
      const disjoint = l.bottom <= t.top || t.bottom <= l.top || l.right <= t.left || t.right <= l.left;
      expect(disjoint, `launcher overlaps reader toolbar at ${frac * 100}%`).toBe(true);
    }
  }

  // המשגר קיים פעם אחת בלבד, ומנווט אל /compass.
  const launcher = page.getByRole("link", { name: new RegExp(LAUNCHER) });
  await expect(launcher).toHaveCount(1);
  await expect(launcher).toBeVisible();

  // ובמפורש: שתי השכבות שהוסרו בגלגול 2 אינן חוזרות בשום צורה.
  await expect(page.locator(".compass-pill")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "בר הטעימה" })).toHaveCount(0);
  await ctx.close();
});

test("/preview mobile: המשגר אינו מסתיר את סוף העמוד", async ({ browser }) => {
  // הליקוי שנמדד לפני התיקון: המשגר הוא `fixed`, כלומר מחוץ לזרימת המסמך,
  // ולכן בגלילה מלאה הוא ישב לצמיתות מעל שורת הזכויות/הנגישות בפוטר — טקסט
  // שאין שום מיקום-גלילה שמשחרר אותו. הפוטר שומר עכשיו את טווח-הנחיתה דרך
  // `--floating-ui-clearance`, והבדיקה הזו מקבעת את זה.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem(
        "cookie-consent",
        JSON.stringify({ necessary: true, analytics: true, marketing: true }),
      );
    } catch {}
  });
  const page = await ctx.newPage();
  await page.goto("/preview", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(400);

  const covered = await page.evaluate(() => {
    const L = document.querySelector<HTMLElement>(
      'a[href="/compass"][title="שאל את הספר"]',
    );
    if (!L) return ["launcher missing"];
    const r = L.getBoundingClientRect();
    const pts: [number, number][] = [
      [r.left + 4, r.top + 4],
      [r.right - 4, r.top + 4],
      [r.left + 4, r.bottom - 4],
      [r.right - 4, r.bottom - 4],
      [r.left + r.width / 2, r.top + r.height / 2],
    ];
    L.style.pointerEvents = "none";
    const hits = new Set<string>();
    for (const [x, y] of pts) {
      const el = document.elementFromPoint(x, y);
      if (!el || L.contains(el)) continue;
      const text = (el.textContent || "").trim();
      if (text) hits.add(el.tagName + " :: " + text.slice(0, 50));
    }
    L.style.pointerEvents = "";
    return [...hits];
  });

  expect(covered, "המשגר מכסה טקסט בסוף העמוד").toEqual([]);
  await ctx.close();
});

test("/preview closing: Amazon is the primary and only purchase action (no waitlist, no form)", async ({ page }) => {
  await page.goto("/preview", { waitUntil: "networkidle" });
  const join = page.locator("#join");
  await join.scrollIntoViewIfNeeded();

  // פעולה ראשית: רכישה באמזון (חיצוני) — הקורא שסיים את הטעימה מוכן לקנות.
  await expect(
    join.getByRole("link", { name: /לרכישת הספר באמזון/ }),
  ).toHaveAttribute("href", /amazon\.com\/dp\/B0GJ3SL9H2/);

  // אין טופס הרשמה ואין קישור לרשימת המתנה — אמזון הוא ערוץ הרכישה היחיד.
  await expect(join.getByLabel("כתובת אימייל")).toHaveCount(0);
  await expect(join.locator('a[href="/waitlist"]')).toHaveCount(0);
});
