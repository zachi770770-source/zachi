import { test, expect } from "./fixtures";

/**
 * „שאל את הספר” — כיסוי מבני: כל 4 התחנות ו-19 הדילמות נגישות, ללא גלילה
 * אופקית ברוחבי מובייל, וללא שליחת טקסט אישי לאנליטיקה (רק מזהים).
 */

const STATIONS: { name: RegExp; dilemmas: number }[] = [
  { name: /חיפוש ודייטים/, dilemmas: 5 },
  { name: /בניית קשר/, dilemmas: 5 },
  { name: /קשר קיים/, dilemmas: 5 },
  { name: /אחרי פרידה/, dilemmas: 4 },
];

test("ask: all 4 stations expose their dilemmas (19 total)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await expect(page.getByRole("radio")).toHaveCount(4); // 4 תחנות

  let total = 0;
  for (const s of STATIONS) {
    await page.getByRole("radio", { name: s.name }).click();
    await expect(page.getByRole("heading", { name: "מה הכי מעסיק אתכם כרגע?" })).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(s.dilemmas);
    total += s.dilemmas;
    await page.getByRole("button", { name: "תחנה אחרת" }).click();
  }
  expect(total).toBe(19);
});

for (const width of [320, 360, 390]) {
  test(`ask: no horizontal overflow through the flow at ${width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 780 } });
    const page = await ctx.newPage();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/compass", { waitUntil: "networkidle" });

    const noOverflow = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    expect(await noOverflow()).toBeLessThanOrEqual(0);

    // תחנה → דילמה (עם הקשר) → תוצאה — בכל שלב אין גלילה אופקית.
    await page.getByRole("radio", { name: /קשר קיים/ }).click();
    expect(await noOverflow()).toBeLessThanOrEqual(0);
    await page.getByRole("radio", { name: /אותם ריבים חוזרים/ }).click(); // הקשר בטיחות
    expect(await noOverflow()).toBeLessThanOrEqual(0);
    await page.getByRole("radio", { name: /מרגיש בטוח לדבר/ }).click(); // תוצאה רגילה
    await expect(page.getByRole("article")).toBeVisible();
    expect(await noOverflow()).toBeLessThanOrEqual(0);

    await ctx.close();
  });
}

test("ask: analytics receives ids only — no personal/free text", async ({ page }) => {
  // מיירטים את dataLayer לפני טעינה; אין consent-gate בבדיקה, אז בודקים את הקריאה
  // ל-window.dataLayer.push דרך stub. כל payload חייב להכיל מזהים בלבד.
  await page.addInitScript(() => {
    (window as unknown as { __events: unknown[] }).__events = [];
    (window as unknown as { dataLayer: unknown[] }).dataLayer = {
      push: (e: unknown) => (window as unknown as { __events: unknown[] }).__events.push(e),
    } as unknown as unknown[];
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/compass", { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: /חיפוש ודייטים/ }).click();
  await page.getByRole("radio", { name: /מתקשה להתחיל/ }).click();
  await expect(page.getByRole("article")).toBeVisible();

  const events = await page.evaluate(
    () => (window as unknown as { __events: Record<string, unknown>[] }).__events,
  );
  // כל הערכים בכל אירוע הם מזהים קצרים/בוליאנים — לא משפטים חופשיים.
  for (const e of events) {
    for (const [k, v] of Object.entries(e)) {
      if (k === "event") continue;
      if (typeof v === "string") {
        expect(v.length).toBeLessThanOrEqual(40);
        expect(v).not.toMatch(/\s/); // מזהה (ללא רווחים), לא טקסט חופשי
      }
    }
  }
});
