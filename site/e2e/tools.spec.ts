import { test, expect } from "./fixtures";

/**
 * אזור ששת הכלים ב-/book (Editorial Luxury): כרטיסי-חזית אינטראקטיביים,
 * חלונית פירוט אחת מתחת (רק כלי אחד פתוח), ו-deep-link מתוצאת „שאל את הספר”.
 * העוגנים `#tool-<id>` נשמרים. תוכן קיים בלבד; המיפוי תשובה→כלי נשמר.
 */

const TOOL_IDS = [
  "tool-quiet-check",
  "tool-fact-story-action",
  "tool-gate-questions",
  "tool-boundary-ladder",
  "tool-twenty-maintenance",
  "tool-emergency-kit",
];

test("/book: six interactive tool cards, closed by default, keyboard toggles open/close", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book", { waitUntil: "networkidle" });
  const cards = page.locator("#tools button.tool-lux-card");
  await expect(cards).toHaveCount(6);

  // כולם סגורים בטעינה (aria-expanded=false), אין חלונית פתוחה, לכל אחד עוגן.
  for (const id of TOOL_IDS) {
    const el = page.locator(`#${id}`);
    await expect(el).toHaveCount(1);
    await expect(el).toHaveAttribute("aria-expanded", "false");
  }
  await expect(page.locator("#tool-detail-panel.is-open")).toHaveCount(0);

  // מקלדת: focus על הכרטיס הראשון, Enter פותח (חלונית מופיעה), Enter סוגר.
  const first = cards.first();
  await first.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#tool-detail-panel.is-open")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#tool-detail-panel.is-open")).toHaveCount(0);
});

test("/book deep-link (#tool-…) opens the matching tool and moves focus to it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book#tool-gate-questions", { waitUntil: "networkidle" });
  const el = page.locator("#tool-gate-questions");
  await expect(el).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#tool-detail-panel.is-open")).toBeVisible();
  // ה-focus עבר לכרטיס הנכון (נגיש).
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(
    "tool-gate-questions",
  );
  // רק כלי אחד פתוח בכל רגע.
  await expect(page.locator("#tools button[aria-expanded='true']")).toHaveCount(1);
});

test("ask result links directly to a real tool card in /book", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אישור הכל" }).click({ timeout: 3000 }).catch(() => {});
  // פותחים את חלונית „שאל את הספר” מכפתור מקטע ה-#where בבית.
  const where = page.locator("#where");
  await where.scrollIntoViewIfNeeded();
  await where.getByRole("button", { name: "שאל את הספר" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // תחנה → דילמה → תוצאה. „לפני קשר” + „מתקשה להתחיל” (בלי שאלת-הקשר)
  // ממופה לכלי fact-story-action.
  await dialog.getByRole("radio", { name: /לפני קשר/ }).click();
  await dialog.getByRole("radio", { name: /מתקשה להתחיל/ }).click();
  const article = dialog.getByRole("article");
  await expect(article.getByText("זה הכיוון שהספר מציע לכם כרגע")).toBeVisible();

  // כלי אמיתי כ-deep-link לכרטיס ב-/book.
  const toolLink = article.locator('a[href^="/book#tool-"]').first();
  await expect(toolLink).toBeVisible();
  const href = await toolLink.getAttribute("href");
  expect(TOOL_IDS).toContain(href!.replace("/book#", ""));

  // הקישור באמת פותח את הכלי המתאים ב-/book.
  await toolLink.scrollIntoViewIfNeeded();
  await toolLink.click();
  const anchor = href!.split("#")[1];
  await expect(page).toHaveURL(new RegExp(`/book#${anchor}$`));
  await expect(page.locator(`#${anchor}`)).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#tool-detail-panel.is-open")).toBeVisible();
});

test("open tool exposes a single CTA to the related book sample (/preview?tool=&station=)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book#tool-quiet-check", { waitUntil: "networkidle" });
  const cta = page.locator("#tool-detail-panel a.tool-lux-panel__cta");
  await expect(cta).toHaveCount(1);
  await expect(cta).toHaveAttribute(
    "href",
    "/preview?tool=quiet-check&station=before-relationship",
  );
});

test("no-JS: every tool front card keeps its name + promise in the DOM", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/book", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#tools button.tool-lux-card")).toHaveCount(6);
  const promises = page.locator("#tools .tool-lux-card__promise");
  await expect(promises).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    await expect(promises.nth(i)).not.toBeEmpty();
  }
  await ctx.close();
});
