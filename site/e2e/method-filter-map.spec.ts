import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

/**
 * „מפת הסינון” האינטראקטיבית ב-/method/core-values („קו אדום מול גמישות”):
 * לכל דוגמה בוחרים איך *אתם* נוטים להתייחס אליה (radiogroup נטיבי), ואז נחשפת
 * נקודת-המבט של הספר + נימוק — בלי ניקוד ובלי „נכון/לא נכון”. נגיש, ועובד ללא JS.
 */

const PAGE = "/method/core-values";

test("filter map: choose a side and the book's reflection reveals (no score, not a quiz)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "קו אדום או גמישות?" })).toBeVisible();
  const map = page.locator("#filter-map");
  await expect(map.locator("fieldset.fmap-item")).toHaveCount(6);

  // רפלקציות מוסתרות עד לבחירה.
  await expect(map.getByText("בספר: קו אדום").first()).toBeHidden();

  // פריט „אמינות” (בספר: קו אדום). בוחרים צד → נחשפת נקודת-המבט של הספר + נימוק.
  const item = map.locator("fieldset.fmap-item", { hasText: "אמינות" });
  await item.getByRole("radio", { name: "קו אדום" }).check({ force: true });
  await expect(item.getByText("בספר: קו אדום")).toBeVisible();
  await expect(item.getByText("אפשר לסמוך על מה שנאמר", { exact: false })).toBeVisible();

  // אין ניקוד: גם בחירה בצד הנגדי מציגה את אותה נקודת-מבט של הספר (לא „טעות”).
  const flexItem = map.locator("fieldset.fmap-item", { hasText: "גובה" });
  await flexItem.getByRole("radio", { name: "קו אדום" }).check({ force: true });
  await expect(flexItem.getByText("בספר: גמישות")).toBeVisible();

  // עיקרון + שורת-רפלקציה סוגרת.
  await expect(map.getByText("תתגמש על איפה הוא שותה את הקפה שלו", { exact: false })).toBeVisible();
  await expect(map.getByText("רבים מתפשרים דווקא על הטור הראשון", { exact: false })).toBeVisible();
});

test("keyboard: focus a choice and select it reveals the reflection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const item = page.locator("fieldset.fmap-item", { hasText: "סגנון לבוש" });
  const radio = item.getByRole("radio", { name: "גמישות" });
  await radio.focus();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await expect(item.getByText("בספר: גמישות")).toBeVisible();
});

test("no-JS: all reflections + reasons are in the DOM, and native radios reveal a reflection", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(PAGE, { waitUntil: "domcontentloaded" });
  // crawlable: הנימוקים והעיקרון קיימים ב-HTML; ששת הרפלקציות קיימות ב-DOM.
  const html = await page.content();
  expect(html).toContain("אפשר לסמוך על מה שנאמר"); // נימוק (צומת-טקסט יחיד)
  expect(html).toContain("שותה את הקפה שלו"); // העיקרון
  await expect(page.locator("#filter-map .fmap-reflect")).toHaveCount(6);
  await expect(page.locator("#filter-map .fmap-badge")).toHaveCount(6);
  const item = page.locator("fieldset.fmap-item", { hasText: "כבוד הדדי" });
  await item.getByRole("radio", { name: "גמישות" }).check({ force: true });
  await expect(item.getByText("בספר: קו אדום")).toBeVisible();
  await ctx.close();
});

test("the filter map appears only on its own concept page, not on other methods", async ({
  page,
}) => {
  await page.goto("/method/quiet-check", { waitUntil: "networkidle" });
  await expect(page.locator("#fmap-heading")).toHaveCount(0);
});

for (const width of [360, 390]) {
  test(`mobile ${width}px: no horizontal overflow after choices`, async ({ page }) => {
    await page.setViewportSize({ width, height: 780 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page
      .locator("fieldset.fmap-item", { hasText: "כבוד הדדי" })
      .getByRole("radio", { name: "קו אדום" })
      .check({ force: true });
    await page
      .locator("fieldset.fmap-item", { hasText: "קצב היכרות" })
      .getByRole("radio", { name: "גמישות" })
      .check({ force: true });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(over).toBe(false);
  });
}

test("axe: the filter map has no serious/critical violations after choices", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page
    .locator("fieldset.fmap-item", { hasText: "אמינות" })
    .getByRole("radio", { name: "קו אדום" })
    .check({ force: true });
  await page
    .locator("fieldset.fmap-item", { hasText: "גובה" })
    .getByRole("radio", { name: "גמישות" })
    .check({ force: true });
  // מוגבל לרכיב שהוספתי. פגם ניגודיות קיים-מראש בקישור „הכלי בעמוד הספר” של
  // MethodPage אינו חלק מהשינוי ומדווח בנפרד.
  const results = await new AxeBuilder({ page })
    .include("#filter-map")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical"
  );
  expect(serious, serious.map((v) => `${v.id} ×${v.nodes.length}`).join("\n")).toEqual([]);
});
