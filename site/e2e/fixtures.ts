import { test as base, expect } from "@playwright/test";

/**
 * בידוד E2E דטרמיניסטי.
 *
 * מספר endpoints מוגנים ב-rate limit לפי IP (waitlist, newsletter, compass,
 * contact, checkout). בריצה מקבילה מלאה כל הבדיקות מגיעות מאותו IP (localhost),
 * ולכן מונה הקצב עלול לדלוף בין בדיקות ולהכשיל שליחה גבולית — בדיקה שעוברת
 * לבד ונכשלת בסוויטה המלאה.
 *
 * הפתרון: כל בדיקה מקבלת „כתובת לקוח” ייחודית דרך x-forwarded-for, כך שכל בדיקה
 * מקבלת דלי-קצב משלה. אין תלות בסדר ההרצה ואין צורך ב-retries. שינוי בצד הבדיקה
 * בלבד — קוד הייצור וה-rate limiting אינם משתנים.
 */

let seq = 0;

export const test = base.extend({
  // הפרמטר השני של fixture הוא ה-provide של Playwright (השם אינו משנה למסגרת;
  // נמנעים מ-`use` כדי שכלל react-hooks לא יזהה אותו בטעות כ-hook).
  extraHTTPHeaders: async ({}, provide, testInfo) => {
    seq += 1;
    // ייחודי לכל (worker, בדיקה): מפריד גם בין תהליכי worker וגם בתוך worker.
    const ip = `198.51.${testInfo.workerIndex % 250}.${(seq % 250) + 1}`;
    await provide({ "x-forwarded-for": ip });
  },
});

export { expect };
export type { Page, Locator } from "@playwright/test";
