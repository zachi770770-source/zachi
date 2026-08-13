import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

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
  // פותחים את חלונית „שאל את הספר” מהגלולה הצפה (מקטע ה-#where הוסר בקיצור העמוד).
  const pill = page.getByRole("button", { name: /מה הספר אומר על המצב שלי\? — / });
  await page.mouse.wheel(0, 200);
  await expect(pill).toHaveCSS("opacity", "1", { timeout: 4000 });
  await pill.click();
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

test("/book fact-story tool: shows the עובדה↔סיפור split, then reveals פעולה", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book#tool-fact-story-action", { waitUntil: "networkidle" });
  const panel = page.locator("#tool-detail-panel");
  await expect(panel).toHaveClass(/is-open/);

  // ההפרדה גלויה מיד — לא פסקה שטוחה אחת.
  await expect(
    panel.getByRole("group", { name: "אותו רגע, מופרד לעובדה ולסיפור" })
  ).toBeVisible();
  await expect(panel.getByText("הצד השני הסתכל בשעון.", { exact: true })).toBeVisible();
  await expect(panel.getByText("משעמם לו או לה איתי; הקשר הזה נגמר.")).toBeVisible();

  // „פעולה” מוסתרת עד לחשיפה מכוונת אחת (aria-expanded).
  const reveal = panel.getByRole("button", { name: "אז מה עושים עם זה?" });
  await expect(reveal).toHaveAttribute("aria-expanded", "false");
  await expect(panel.getByRole("group", { name: "פעולה" })).toHaveCount(0);

  await reveal.click();
  await expect(reveal).toHaveAttribute("aria-expanded", "true");
  await expect(panel.getByRole("group", { name: "פעולה" })).toBeVisible();
  await expect(panel.getByText(/הכול בסדר עם הזמנים שלך/)).toBeVisible();

  // עדיין רק כרטיס-כלי אחד פתוח, וה-CTA לקטע מהספר נשמר.
  await expect(
    page.locator("#tools button.tool-lux-card[aria-expanded='true']")
  ).toHaveCount(1);
  await expect(page.locator("#tool-detail-panel a.tool-lux-panel__cta")).toHaveAttribute(
    "href",
    "/preview?tool=fact-story-action&station=before-relationship"
  );
});

for (const width of [360, 390]) {
  test(`/book fact-story tool @${width}px: no horizontal overflow through the reveal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto("/book#tool-fact-story-action", { waitUntil: "networkidle" });
    const overflow = () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1
      );
    expect(await overflow()).toBe(false);
    await page.getByRole("button", { name: "אז מה עושים עם זה?" }).click();
    await expect(page.getByRole("group", { name: "פעולה" })).toBeVisible();
    expect(await overflow()).toBe(false);
  });
}

test("/book fact-story tool: no axe violations with the split and פעולה open", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book#tool-fact-story-action", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "אז מה עושים עם זה?" }).click();
  await expect(page.getByRole("group", { name: "פעולה" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include("#tool-detail-panel")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
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
