import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

/**
 * „רגע אחד — שלוש שכבות” ב-/method/fact-story („עובדה, סיפור, פעולה”): בוחרים רגע
 * אמיתי (עובדה) ואז את הסיפור שהוסף עליו, ואז נחשפת ההפרדה — „מה שקרה” לצד „מה
 * שהוספתם”, עם „רק הראשון קרה באמת” + שאלות-פעולה. אין ניקוד, אין נכון/לא-נכון,
 * המצב ephemeral (ללא רשת/אחסון). אי-לקוח קטן — נבדק עם מקלדת ובמובייל.
 */

const PAGE = "/method/fact-story";

test("fact-story lab: pick a moment + the story, and the separation + action reveal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "רגע אחד, שלוש שכבות" })).toBeVisible();
  const lab = page.locator("#fact-story-lab");

  // בהתחלה: רק שלב 1. אין שלב סיפור ואין ההפרדה.
  await expect(lab.getByText("מה שהוספתם")).toHaveCount(0);
  await expect(lab.getByRole("radiogroup", { name: "ומה הראש כבר סיפר על זה?" })).toHaveCount(0);

  // שלב 1 — בוחרים עובדה. שלב 2 נחשף.
  await lab.getByRole("radio", { name: "לא ענה/תה לי מאתמול" }).check({ force: true });
  await expect(lab.getByRole("radiogroup", { name: "ומה הראש כבר סיפר על זה?" })).toBeVisible();
  // עדיין אין הפרדה — צריך גם סיפור.
  await expect(lab.getByText("רק הראשון קרה באמת", { exact: false })).toHaveCount(0);

  // שלב 2 — בוחרים סיפור. ההפרדה + הפעולה נחשפים, עם שני הטקסטים זה לצד זה.
  await lab.getByRole("radio", { name: "כנראה איבד/ה בי עניין" }).check({ force: true });
  await expect(lab.getByText("מה שקרה", { exact: true })).toBeVisible();
  await expect(lab.getByText("מה שהוספתם", { exact: true })).toBeVisible();
  await expect(lab.getByText("לא ענה/תה לי מאתמול").last()).toBeVisible();
  await expect(lab.getByText("כנראה איבד/ה בי עניין").last()).toBeVisible();
  await expect(lab.getByText("רק הראשון קרה באמת", { exact: false })).toBeVisible();
  // שלב הפעולה — שאלות רפלקציה (לא עצה/ניקוד).
  await expect(lab.getByText("איך הייתי מגיב/ה אילו הגבתי רק לעובדה?")).toBeVisible();

  // אין ניקוד/נכון-לא-נכון: כל צירוף מציג את אותה הפרדה נייטרלית.
  await expect(lab.getByText(/נכון|טעות|ציון|נכשל/)).toHaveCount(0);

  // reset — חוזרים לשלב 1 בלבד.
  await lab.getByRole("button", { name: "להתחיל מרגע אחר" }).click();
  await expect(lab.getByText("מה שהוספתם")).toHaveCount(0);
});

test("fact-story lab: free-text moment stays usable (ephemeral, offline-friendly)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const lab = page.locator("#fact-story-lab");

  await lab.getByRole("radio", { name: "רגע אחר…" }).check({ force: true });
  await lab.getByPlaceholder("מה קרה? במשפט אחד, בלי פרשנות").fill("הפגישה בבית קפה הסתיימה מוקדם");
  await lab.getByRole("radio", { name: "משהו אחר…" }).check({ force: true });
  await lab.getByPlaceholder("מה הראש הוסיף, במילים שלכם").fill("בטח לא נהנה/נהנתה");

  await expect(lab.getByText("הפגישה בבית קפה הסתיימה מוקדם").last()).toBeVisible();
  await expect(lab.getByText("בטח לא נהנה/נהנתה").last()).toBeVisible();
  await expect(lab.getByText("רק הראשון קרה באמת", { exact: false })).toBeVisible();
});

test("keyboard: a moment then a story can be selected with the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const lab = page.locator("#fact-story-lab");

  const moment = lab.getByRole("radio", { name: "הדייט נדחה ברגע האחרון" });
  await moment.focus();
  await page.keyboard.press("Space");
  await expect(moment).toBeChecked();

  const story = lab.getByRole("radio", { name: "זה עומד להיגמר" });
  await story.focus();
  await page.keyboard.press("Space");
  await expect(story).toBeChecked();
  await expect(lab.getByText("רק הראשון קרה באמת", { exact: false })).toBeVisible();
});

test("the fact-story lab appears only on its own concept page, not on other methods", async ({
  page,
}) => {
  await page.goto("/method/quiet-check", { waitUntil: "networkidle" });
  await expect(page.locator("#fact-story-lab")).toHaveCount(0);
  await expect(page.locator("#fslab-heading")).toHaveCount(0);
});

for (const width of [360, 390]) {
  test(`mobile ${width}px: no horizontal overflow after choices`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 780 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const lab = page.locator("#fact-story-lab");
    // scroll each control to viewport-center before selecting — הפעלת הבועה/באנר
    // העוגיות תופסים את תחתית המסך במובייל, ו-scrollIntoViewIfNeeded עלול ליישר
    // לקצה התחתון מתחתיהם.
    const moment = lab.getByRole("radio", { name: "הטון היה קריר מהרגיל" });
    await moment.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await moment.check({ force: true });
    const story = lab.getByRole("radio", { name: "כנראה שלא באמת אכפת לו/לה" });
    await story.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await story.check({ force: true });
    await expect(lab.getByText("רק הראשון קרה באמת", { exact: false })).toBeVisible();
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(over).toBe(false);
  });
}

test("axe: the fact-story lab has no serious/critical violations after choices", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const lab = page.locator("#fact-story-lab");
  await lab.getByRole("radio", { name: "נאמר משהו שלא הבנתי עד הסוף" }).check({ force: true });
  await lab.getByRole("radio", { name: "בטח עשיתי משהו לא בסדר" }).check({ force: true });
  // מוגבל לרכיב שהוספתי. פגם ניגודיות קיים-מראש בקישור „הכלי בעמוד הספר” של
  // MethodPage אינו חלק מהשינוי ומדווח בנפרד.
  const results = await new AxeBuilder({ page })
    .include("#fact-story-lab")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, serious.map((v) => `${v.id} ×${v.nodes.length}`).join("\n")).toEqual([]);
});
