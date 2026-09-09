import { test, expect } from "@playwright/test";

import { whyTheBook } from "../src/content/homeStory";

/**
 * המעבר העריכתי של עמוד הבית — הבדיקות שנוספו הן על ההתנהגות שהשתנתה בפועל:
 * סדר המקטעים, היעדר כרום-כרטיס בשני המקטעים שנוקו, נוכחות הדיוקן, וזה
 * שהמשטח הגדול נקרא ירוק-פטרול ולא כמעט-שחור. אין כאן בדיקה שמקבעת ערכי-פיקסל
 * שרירותיים — כל טענה היא על מה שהמבקר רואה.
 */

const ORDER = [
  "sig-hero",
  "recognition-heading",
  "why-book-heading",
  "author-note-heading",
  "sample-bridge",
  "path",
  "deeper-entry",
  "get-the-book",
];

test("עמוד הבית: הטיעון על הספר בא לפני סיפור המחבר", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const tops = await page.evaluate(() => {
    const pick = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().top + scrollY) : null;
    };
    return {
      hero: pick(".sig-hero"),
      recognition: pick("[aria-labelledby='recognition-heading']"),
      why: pick("[aria-labelledby='why-book-heading']"),
      author: pick("[aria-labelledby='author-note-heading']"),
      bridge: pick("#sample-bridge"),
      path: pick("#path"),
      deeper: pick(".deeper-entry"),
      close: pick("#get-the-book"),
    };
  });
  const seq = [
    tops.hero,
    tops.recognition,
    tops.why,
    tops.author,
    tops.bridge,
    tops.path,
    tops.deeper,
    tops.close,
  ];
  expect(seq.some((v) => v === null), `מקטע חסר: ${JSON.stringify(tops)}`).toBe(false);
  for (let i = 1; i < seq.length; i += 1) {
    expect(seq[i]!, `${ORDER[i]} אחרי ${ORDER[i - 1]}`).toBeGreaterThan(seq[i - 1]!);
  }
});

test("„למה בכלל ספר”: קומפוזיציה עריכתית — בלי פאנל, בלי רשימה ממוספרת, בלי CTA שני", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("[aria-labelledby='why-book-heading']");
  await section.scrollIntoViewIfNeeded();

  // אין מיכל מוקף-מסגרת בעל רדיוס גדול בתוך המקטע.
  const panels = await section.evaluate((root) =>
    [...root.querySelectorAll("*")].filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        parseFloat(cs.borderTopLeftRadius) >= 10 &&
        parseFloat(cs.borderTopWidth) >= 1 &&
        cs.borderTopStyle !== "none" &&
        r.width >= 240 &&
        r.height >= 100
      );
    }).length,
  );
  expect(panels).toBe(0);

  // לכל היותר שלוש אמירות-תוצאה, ואין רשימה ממוספרת.
  await expect(section.locator("li")).toHaveCount(whyTheBook.book.lines.length);
  expect(whyTheBook.book.lines.length).toBeLessThanOrEqual(3);
  await expect(section.locator("ol")).toHaveCount(0);

  // קישור-טקסט משני אחד אל /book — ואין כאן כפתור-פעולה מלא.
  const bookLink = section.locator('a[href="/book"]');
  await expect(bookLink).toHaveCount(1);
  const filled = await section.evaluate((root) =>
    [...root.querySelectorAll("a, button")].filter((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (!m) return false;
      const p = m[1].split(",").map(Number);
      return !(p.length > 3 && p[3] < 0.5);
    }).length,
  );
  expect(filled).toBe(0);
});

test("רגע-המחבר: דיוקן אמיתי נראה, בלי כרום-כרטיס, עם הגבול הלא-קליני", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("[aria-labelledby='author-note-heading']");
  await section.scrollIntoViewIfNeeded();

  const img = section.locator("img").first();
  await expect(img).toBeVisible();
  const box = await img.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(180);
  await expect(img).toHaveAttribute("alt", /צחי חן/);
  await expect(img).toHaveAttribute("src", /author\//);

  await expect(section.locator('a[href="/author"]')).toHaveCount(1);
  await expect(section).toContainText("לא טיפול ולא אבחון");

  const panels = await section.evaluate((root) =>
    [...root.querySelectorAll("*")].filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (
        parseFloat(cs.borderTopLeftRadius) >= 10 &&
        parseFloat(cs.borderTopWidth) >= 1 &&
        cs.borderTopStyle !== "none" &&
        r.width >= 240 &&
        r.height >= 100
      );
    }).length,
  );
  expect(panels).toBe(0);
});

test("מובייל 390: הדיוקן נשאר נוכח, בגודל שורת-חתימה", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  const section = page.locator("[aria-labelledby='author-note-heading']");
  await section.scrollIntoViewIfNeeded();
  const visible = await section.evaluate((root) =>
    [...root.querySelectorAll("img")]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => Math.round(r.width)),
  );
  expect(visible).toHaveLength(1);
  expect(visible[0]).toBeGreaterThanOrEqual(40);
  expect(visible[0]).toBeLessThanOrEqual(120);
  await ctx.close();
});

test("המשטחים הגדולים: פטרול-ירוק, לא כמעט-שחור — ואותה משפחה ב-Hero ובסגירה", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const read = (sel: string) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const parse = (c: string) => {
        const m = c.match(/rgba?\(([^)]+)\)/);
        return m ? m[1].split(",").map(Number) : null;
      };
      // הרקע של השדה מגיע מהגרדיאנט על שכבת ה-__bg; לוקחים את צבע-הבסיס
      // של המקטע עצמו כאשר הוא אטום, ואחרת את הצבע המחושב של השכבה.
      const own = parse(getComputedStyle(el).backgroundColor);
      return own && own[3] !== 0 ? own : null;
    }, sel);

  const hero = await read(".sig-hero");
  expect(hero, "ל-Hero יש צבע-בסיס אטום").not.toBeNull();
  const [r, g, b] = hero as number[];

  // ירוק: הערוץ הירוק הוא הגבוה ביותר, והכחול אינו עוקף אותו (לא טורקיז/כחול).
  expect(g).toBeGreaterThan(r);
  expect(g).toBeGreaterThan(b);

  // לא כמעט-שחור: בהירות תפיסתית מעל סף שנקבע מול המצב הקודם (L*≈19).
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const y = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const lstar = y > 0.008856 ? 116 * y ** (1 / 3) - 16 : 903.3 * y;
  expect(lstar).toBeGreaterThan(20);
  expect(lstar).toBeLessThan(30); // ועדיין עמוק — לא „ירוק בהיר”

  // ניגודיות טקסט-השנהב על השדה נשארת מעל AA בפער נוח.
  const ivory = [246, 240, 231];
  const yi = 0.2126 * lin(ivory[0]) + 0.7152 * lin(ivory[1]) + 0.0722 * lin(ivory[2]);
  const ratio = (Math.max(yi, y) + 0.05) / (Math.min(yi, y) + 0.05);
  expect(ratio).toBeGreaterThan(7);
});

test("חמש הבחירות: קישורים אמיתיים, יעד-מגע מלא, וסימן-כיוון גלוי", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const path = page.locator("#path");
  await path.scrollIntoViewIfNeeded();
  const cards = path.locator("a.situation-card");
  await expect(cards).toHaveCount(5);

  for (let i = 0; i < 5; i += 1) {
    const card = cards.nth(i);
    const box = await card.boundingBox();
    expect(box?.height ?? 0, `יעד-מגע לכרטיס ${i}`).toBeGreaterThanOrEqual(44);
    // סימן-הכיוון נראה גם בלי ריחוף — במגע אין hover.
    const cueOpacity = await card
      .locator(".situation-card__cue")
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(cueOpacity).toBeGreaterThan(0.2);
  }
});
