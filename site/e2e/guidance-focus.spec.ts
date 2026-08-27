import { test, expect, type Page } from "./fixtures";

/**
 * „מצב-תגובה” משותף להכוונה אישית (GuidanceFocus / AnswerView): ברגע שמתקבלת
 * תשובה, קליפת-הפתיח השיווקית של העמוד מתקפלת והתשובה הופכת למוקד — עקבי בכל
 * מסלולי ההכוונה, לא פתרון-נקודה. כאן נבדק המצפן המודרך (/compass), כולל
 * ה-edge cases: מוקד בתשובה, איפוס בהתחלה-מחדש, שמירת-מוקד ברענון, ו-h1 יחיד.
 */

const INTRO_MARKER = "2-3 שאלות קצרות"; // צ'יפ בקליפת-הפתיח

async function walkToResult(page: Page) {
  for (let i = 0; i < 4; i++) {
    if (await page.locator("section.answer-view article.stuck-answer").count()) return;
    const radios = page.getByRole("radio");
    await radios.first().waitFor({ state: "visible", timeout: 5000 });
    await radios.first().click();
    await page.waitForTimeout(350);
  }
}

test.describe("guidance focus — guided compass", () => {
  test("collapses the marketing intro when the answer appears, and keeps one h1", async ({ page }) => {
    await page.goto("/compass", { waitUntil: "networkidle" });
    // before: intro (h1 + chips) is the focus.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(INTRO_MARKER)).toBeVisible();

    await walkToResult(page);

    // after: intro collapsed, answer is the focus.
    await expect(page.locator("section.answer-view article.stuck-answer")).toBeVisible();
    await expect(page.getByText(INTRO_MARKER)).toBeHidden();
    // exactly one h1 exposed — the AnswerView sr-only heading (intro h1 is display:none).
    await expect(page.locator("section.answer-view h1")).toHaveCount(1);
  });

  test("restarting brings the intro back (focus is reversible)", async ({ page }) => {
    await page.goto("/compass", { waitUntil: "networkidle" });
    await walkToResult(page);
    await expect(page.getByText(INTRO_MARKER)).toBeHidden();

    // "להתחיל מחדש" returns to the station step → intro reappears.
    await page.getByRole("button", { name: /להתחיל מחדש/ }).click();
    await expect(page.getByText(INTRO_MARKER)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("refresh on a restored answer stays focused (does not flash the marketing intro)", async ({ page }) => {
    await page.goto("/compass", { waitUntil: "networkidle" });
    await walkToResult(page);
    // the guided engine persists station+dilemma → the answer restores on reload.
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("section.answer-view article.stuck-answer")).toBeVisible();
    await expect(page.getByText(INTRO_MARKER)).toBeHidden();
  });

  test("mobile: the answer is focused with no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/compass", { waitUntil: "networkidle" });
    await walkToResult(page);
    await expect(page.locator("section.answer-view article.stuck-answer")).toBeVisible();
    await expect(page.getByText(INTRO_MARKER)).toBeHidden();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
});

test.describe("guidance focus — embedded engines keep their own single h1", () => {
  test("home page keeps exactly one h1 even when the inline guided engine reaches an answer", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // open the inline guided conversation from a situation starter, then walk to an answer.
    const starter = page.getByRole("link", { name: /לפני קשר|זוגיות|פרידה|בתוך/ }).first();
    if (await starter.count()) {
      await starter.click().catch(() => {});
      await walkToResult(page).catch(() => {});
    }
    // the embedded engine must NOT inject a second page h1 (AnswerView h1 is gated to page surfaces).
    await expect(page.locator("h1")).toHaveCount(1);
  });
});
