import { test, expect, type Page } from "@playwright/test";

/**
 * רגרסיה: לא יישאר באתר שום מסר שמציג את הספר כ„עוד לא יצא” / pre-launch. הספר
 * זמין לרכישה עכשיו באמזון. סורק את העמודים המרכזיים ומוודא שאף אחד מהביטויים
 * הישנים אינו מוצג, ושאין קישור מת ל-/waitlist בשום מקום.
 */

// ביטויים אסורים (טרום-השקה / רשימת המתנה). „בהמשך” למהדורה מודפסת מותר — הוא
// אינו טוען שהספר לא יצא, אלא שהמהדורה המודפסת ספציפית עתידית.
const FORBIDDEN = [
  "קבלו עדכון כשהספר יוצא",
  "כשהספר יוצא",
  "כשהספר ייצא",
  "תיפתח לרכישה בקרוב",
  "המכירה תיפתח בקרוב",
  "עדכנו אותי כשהמהדורה הישירה תיפתח",
  "לפני שהוא יוצא",
];

const ROUTES = [
  "/",
  "/book",
  "/preview",
  "/compass",
  "/before-relationship",
  "/building-relationship",
  "/inside-relationship",
  "/after-breakup",
  "/author",
  "/faq",
  "/terms",
  "/shipping-returns",
  "/contact",
];

async function bodyText(page: Page): Promise<string> {
  return (await page.locator("body").innerText()).replace(/\s+/g, " ");
}

for (const route of ROUTES) {
  test(`${route} shows no pre-launch / waitlist messaging and no /waitlist link`, async ({
    page,
  }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    const text = await bodyText(page);
    for (const phrase of FORBIDDEN) {
      expect(text, `"${phrase}" must not appear on ${route}`).not.toContain(phrase);
    }
    // אין קישור מת לעמוד רשימת ההמתנה שנמחק.
    await expect(page.locator('a[href="/waitlist"]')).toHaveCount(0);
  });
}

test("the assistant drawer result offers the Amazon purchase, never a waitlist CTA", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/before-relationship", { waitUntil: "networkidle" });
  const accept = page.getByRole("button", { name: "אישור הכל" });
  if (await accept.count()) await accept.first().click().catch(() => {});

  await page.getByRole("button", { name: /מה הספר אומר על המצב שלי\?, / }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: /שחוק.* מאפליקציות ומדייטים/ }).click();
  await expect(dialog.getByRole("article")).toBeVisible();

  // יש קישור רכישה אמיתי לאמזון, ואין ניסוח של רשימת המתנה / „כשהספר יוצא”.
  await expect(
    dialog.locator('a[href*="amazon.com/dp/B0GJ3SL9H2"]').first(),
  ).toBeVisible();
  const drawerText = (await dialog.locator("*").first().innerText()).replace(/\s+/g, " ");
  for (const phrase of ["קבלו עדכון כשהספר יוצא", "רשימת ההמתנה", "כשהספר יוצא"]) {
    expect(drawerText).not.toContain(phrase);
  }
});
