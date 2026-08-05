import { test, expect } from "./fixtures";

/**
 * הכלים האינטראקטיביים ב-/book (בנטו `<details>` נגיש) + deep-link מתוצאת
 * ה-Path Finder. תוכן קיים בלבד; המיפוי תשובה→כלי נשמר.
 */

const TOOL_IDS = [
  "tool-fact-story-action",
  "tool-gate-questions",
  "tool-quiet-check",
  "tool-twenty-maintenance",
  "tool-boundary-ladder",
  "tool-emergency-kit",
];

test("/book: six interactive tool cards, closed by default, keyboard toggles open/close", async ({
  page,
}) => {
  await page.goto("/book", { waitUntil: "networkidle" });
  const details = page.locator("#tools details.tool-acc");
  await expect(details).toHaveCount(6);

  // כולם סגורים בטעינה; לכל אחד עוגן יציב.
  for (const id of TOOL_IDS) {
    const el = page.locator(`#${id}`);
    await expect(el).toHaveCount(1);
    await expect(el).toHaveJSProperty("open", false);
  }

  // מקלדת: focus על ה-summary הראשון, Enter פותח, Enter סוגר.
  const firstSummary = details.first().locator("summary");
  await firstSummary.focus();
  await page.keyboard.press("Enter");
  await expect(details.first()).toHaveJSProperty("open", true);
  await page.keyboard.press("Enter");
  await expect(details.first()).toHaveJSProperty("open", false);
});

test("/book deep-link (#tool-…) opens the matching tool card and moves focus to it", async ({
  page,
}) => {
  await page.goto("/book#tool-gate-questions", { waitUntil: "networkidle" });
  const el = page.locator("#tool-gate-questions");
  await expect(el).toHaveJSProperty("open", true);
  // ה-focus עבר ל-summary של אותו כלי (נגיש).
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.closest("details")?.id))
    .toBe("tool-gate-questions");
  // ה-summary של הכרטיס מתייצב סמוך לראש אזור-הצפייה, מתחת ל-header הדביק
  // (scroll-mt-24): בטווח [-5, 200). poll על הטווח כולו סופג ערכי-ביניים רגעיים
  // בזמן שהגלילה עדיין מתמקמת (הכרטיס הפתוח גבוה ומשנה גובה-שורה בגריד), בלי
  // להשוות פיקסל בודד שמתחרה עם ההתייצבות. ההבטחה: הכרטיס פתוח, ממוקד, וגלוי.
  await expect
    .poll(() =>
      el.locator("summary").evaluate((n) => {
        const top = n.getBoundingClientRect().top;
        return top >= -5 && top < 200;
      }),
    )
    .toBe(true);
});

test("path finder result links directly to a real tool card in /book", async ({ page }) => {
  // reduced-motion: התוצאה/הכרטיסים מיד במצב סופי (בלי „element is not stable”).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();
  // סוגרים את באנר-העוגיות פעם אחת כדי שלא ישנה padding-bottom עם כל גלילה.
  await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 3000 }).catch(() => {});
  // בוחרים תשובה אחת בכל אחת משלוש השאלות (ראשונה בכל שאלה). מעגנים כל רדיו
  // למרכז לפני הקליק — ה-header הדביק מכסה את ראש התצוגה ו-Playwright מגלגל
  // יעד לראש כברירת מחדל.
  for (let i = 0; i < 3; i++) {
    const radio = where.locator('[role="radio"]').first();
    await radio.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await radio.click();
  }
  const article = where.locator("article");
  await expect(article.getByText(/נקודת הפתיחה שלכם/)).toBeVisible();
  // מציג את הקושי שנבחר + הכלי; ה-CTA הראשי הוא deep-link לכרטיס כלי אמיתי.
  const primary = article.locator('a[href^="/book#tool-"]').first();
  await expect(primary).toBeVisible();
  const href = await primary.getAttribute("href");
  expect(TOOL_IDS).toContain(href!.replace("/book#", ""));

  // הקישור באמת פותח את הכלי המתאים ב-/book.
  await primary.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await primary.click();
  await expect(page).toHaveURL(new RegExp(`/book#${href!.split("#")[1]}$`));
  await expect(page.locator(`#${href!.split("#")[1]}`)).toHaveJSProperty("open", true);
});

test("no-JS: every tool card keeps its description in the DOM (native <details>)", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/book", { waitUntil: "domcontentloaded" });
  const bodies = page.locator("#tools details.tool-acc .tool-acc__body .tool-acc__desc");
  await expect(bodies).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    await expect(bodies.nth(i)).not.toBeEmpty();
  }
  await ctx.close();
});
