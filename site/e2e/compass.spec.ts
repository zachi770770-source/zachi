import { test, expect } from "./fixtures";

/**
 * „שאל את הספר” (/compass) — מנוע הכוונה סגור ודטרמיניסטי בשלוש שכבות:
 * תחנה → דילמה → שאלת-הקשר אחת (רק כשרלוונטי) → תוצאה בת 8 חלקים. שכבת בטיחות
 * דורסת במצבי סכנה. אין AI, אין טקסט חופשי, אין אבחון/אחוזי-ביטחון.
 */

const station = {
  dating: /לפני קשר/,
  building: /בניית קשר/,
  existing: /בתוך קשר/,
  afterBreakup: /אחרי פרידה/,
};

test("ask: station → dilemma → 8-part result (tool + sample + waitlist), no %", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();
  await page.getByRole("radio", { name: station.dating }).click();
  await expect(page.getByRole("heading", { name: "מה הכי מעסיק אתכם כרגע?" })).toBeVisible();
  await page.getByRole("radio", { name: /מתקשה להתחיל/ }).click(); // d-start (בלי הקשר)

  const r = page.getByRole("article");
  await expect(r).toHaveAttribute("aria-live", "polite");
  await expect(r.getByText("זה הכיוון שהספר מציע לכם כרגע")).toBeVisible();
  await expect(r.getByRole("heading")).toContainText("מתקשה להתחיל");
  // 8 החלקים
  await expect(r.getByText("ההבחנה המרכזית")).toBeVisible();
  await expect(r.getByText("כדאי לבדוק לפני שמחליטים")).toBeVisible();
  await expect(r.getByText("כלי מהספר שמתאים כאן")).toBeVisible();
  await expect(r.getByText("פעולה קטנה להיום")).toBeVisible();
  await expect(r.getByText("מה לא כדאי להסיק מהר מדי")).toBeVisible();
  // כלי + טעימה מתאימה (d-start → fact-story-action) + רשימת המתנה
  await expect(r.locator('a[href="/book#tool-fact-story-action"]')).toBeVisible();
  await expect(
    r.locator('a[href="/preview?tool=fact-story-action&station=before-relationship"]'),
  ).toBeVisible();
  await expect(r.locator('a[href="/waitlist"]')).toBeVisible();
  await expect(r.getByText(/%/)).toHaveCount(0);
  await expect(r.getByText(/צ.אט|בינה מלאכות|שיחה עם|AI/)).toHaveCount(0);
});

test("ask: a context question appears only for dilemmas that need it, and adds an adaptation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: station.dating }).click();
  await page.getByRole("radio", { name: /פוסל.*מהר מדי/ }).click(); // d-reject-fast (יש הקשר)

  // שאלת-הקשר אחת בלבד
  await expect(page.getByText("האם משהו מאלה חלק מהתמונה שלכם עכשיו?")).toBeVisible();
  await page.getByRole("radio", { name: /ילדים, גרוש/ }).click();

  const r = page.getByRole("article");
  await expect(r.getByText("התאמה למצב שלכם")).toBeVisible();
  await expect(r.getByText(/אין המון זמן פנוי, יש ילדים/)).toBeVisible();
});

test("ask: safety routing overrides the normal result (fear/control/danger)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: station.existing }).click();
  await page.getByRole("radio", { name: /אותם ריבים חוזרים/ }).click(); // d-same-fights (הקשר בטיחות)
  await expect(page.getByText(/איך זה מרגיש בבית כרגע/)).toBeVisible();
  await page.getByRole("radio", { name: /פחד, שליטה, פגיעה או סכנה/ }).click();

  const r = page.getByRole("article");
  await expect(r.getByRole("heading")).toContainText("לא המקום המתאים");
  await expect(r.getByText(/פנו לעזרה מקצועית/)).toBeVisible();
  // אין עצה זוגית רגילה
  await expect(r.getByText("ההבחנה המרכזית")).toHaveCount(0);
  await expect(r.getByText("כלי מהספר שמתאים כאן")).toHaveCount(0);
});

test("ask: after-breakup is a transition station (does not force a direction)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: station.afterBreakup }).click();
  await page.getByRole("radio", { name: /רוצה לחזור בעיקר בגלל בדידות/ }).click(); // d-loneliness (בלי הקשר)

  const r = page.getByRole("article");
  await expect(r.getByText("נראה שזה המקום שבו הספר יכול לפגוש אתכם עכשיו")).toBeVisible();
  await expect(r.getByRole("heading")).toContainText("בדידות");
});

test("ask: back, change dilemma/station and restart", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: station.building }).click();
  await expect(page.getByRole("heading", { name: "מה הכי מעסיק אתכם כרגע?" })).toBeVisible();
  await page.getByRole("button", { name: "תחנה אחרת" }).click();
  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();

  await page.getByRole("radio", { name: station.building }).click();
  await page.getByRole("radio", { name: /פער בין המילים/ }).click(); // d-words-actions (בלי הקשר)
  await expect(page.getByRole("article")).toBeVisible();
  await page.getByRole("button", { name: "דילמה אחרת" }).click();
  await expect(page.getByRole("heading", { name: "מה הכי מעסיק אתכם כרגע?" })).toBeVisible();
  await page.getByRole("radio", { name: /פער בין המילים/ }).click();
  await page.getByRole("button", { name: /להתחיל מחדש/ }).click();
  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();
});

test("ask: keyboard-only — focus a radio and Enter advances", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  const first = page.getByRole("radio").first();
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "מה הכי מעסיק אתכם כרגע?" })).toBeVisible();
});

test("ask: persists only station + dilemma ids; reset clears them", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: station.existing }).click();
  await page.getByRole("radio", { name: /נוצרו ריחוק ושגרה/ }).click(); // d-distance-routine (הקשר פרק ב')
  await page.getByRole("radio", { name: /אין כרגע מורכבות/ }).click(); // ללא התאמת פרק ב'
  await expect(page.getByRole("article")).toBeVisible();

  const saved = await page.evaluate(() => window.localStorage.getItem("mlc.ask.v1"));
  expect(JSON.parse(saved!)).toEqual({ stationId: "existing", dilemmaId: "d-distance-routine" });

  await page.getByRole("button", { name: /להתחיל מחדש/ }).click();
  const cleared = await page.evaluate(() => window.localStorage.getItem("mlc.ask.v1"));
  expect(cleared).toBeNull();
});

test("ask: a returning visitor with a saved route sees the result directly", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        "mlc.ask.v1",
        JSON.stringify({ stationId: "existing", dilemmaId: "d-emotional-gap" }),
      );
    } catch {
      /* ignore */
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await expect(page.getByRole("article").getByRole("heading")).toContainText(
    "פער בצרכים הרגשיים",
  );
});

test("ask: corrupt saved data still shows the station chooser (no crash)", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("mlc.ask.v1", "{corrupt");
    } catch {
      /* ignore */
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "איפה אתם עכשיו?" })).toBeVisible();
});
