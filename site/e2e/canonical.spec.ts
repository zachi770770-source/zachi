import { test, expect } from "./fixtures";

/**
 * הגנת אינדוקס: תג ה-<link rel="canonical"> בכל עמוד חייב להצביע לדומיין
 * הפרודקשן הקבוע (https://www.zachi.co.il/<path>) — לעולם לא לכתובת preview של
 * Vercel (…​.vercel.app) ולעולם לא לכתובת יחסית. באג היסטורי: /book ו-/faq
 * הצביעו לדומיין preview, מה שמפצל אותות אינדוקס. הבדיקה נכשלת אם canonical
 * חסר, יחסי, מצביע ל-vercel.app, או אינו תואם את הנתיב.
 */

const PROD_ORIGIN = "https://www.zachi.co.il";

// כל 16 העמודים הניתנים לגילוי (בלי /api ובלי עמודים דינמיים של סליקה שאינם
// לאינדוקס). המפתח הוא הנתיב; הערך הוא ה-canonical המצופה המלא.
const ROUTES: Array<[string, string]> = [
  // עמוד הבית: Next פולט את מקור הפרודקשן ללא לוכסן-סיום.
  ["/", PROD_ORIGIN],
  ["/author", `${PROD_ORIGIN}/author`],
  ["/book", `${PROD_ORIGIN}/book`],
  ["/compass", `${PROD_ORIGIN}/compass`],
  ["/preview", `${PROD_ORIGIN}/preview`],
  ["/faq", `${PROD_ORIGIN}/faq`],
  ["/waitlist", `${PROD_ORIGIN}/waitlist`],
  ["/contact", `${PROD_ORIGIN}/contact`],
  ["/terms", `${PROD_ORIGIN}/terms`],
  ["/privacy", `${PROD_ORIGIN}/privacy`],
  ["/shipping-returns", `${PROD_ORIGIN}/shipping-returns`],
  ["/before-relationship", `${PROD_ORIGIN}/before-relationship`],
  ["/building-relationship", `${PROD_ORIGIN}/building-relationship`],
  ["/after-breakup", `${PROD_ORIGIN}/after-breakup`],
  ["/starting-again", `${PROD_ORIGIN}/starting-again`],
  ["/inside-relationship", `${PROD_ORIGIN}/inside-relationship`],
];

for (const [path, expected] of ROUTES) {
  test(`canonical on ${path} points to the production domain (never vercel.app)`, async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const canonical = page.locator('link[rel="canonical"]');
    // חייב להתקיים בדיוק אחד.
    await expect(canonical).toHaveCount(1);
    const href = await canonical.getAttribute("href");
    expect(href, `canonical href on ${path}`).toBe(expected);
    // הגנות מפורשות מעבר להשוואה המדויקת, כדי שהכישלון יהיה מובן.
    expect(href, `canonical must be absolute on ${path}`).toMatch(/^https:\/\//);
    expect(href, `canonical must not point to a Vercel preview on ${path}`).not.toContain(
      "vercel.app"
    );
  });
}
