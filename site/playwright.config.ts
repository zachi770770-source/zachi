import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

/** הבדיקות של המשטח החופשי — רצות רק מול השרת עם דגל העוזר (ראו projects). */
// מפרטים שחייבים לרוץ מול השרת השני (3101) שבו דגל העוזר החופשי דלוק.
const FREE_TEXT_SPEC = /compass-(free-text-live|safety)\.spec\.ts/;

/**
 * דפדפן ההרצה.
 *
 * בסביבת הפיתוח המנוהלת כאן Chromium כבר מותקן מראש בנתיב קבוע, ו-Playwright
 * לא אמור להוריד עותק משלו. על runner של GitHub הנתיב הזה *אינו קיים*, ונתיב
 * קשיח היה מפיל כל בדיקה עוד לפני שהיא נפתחת — זו בדיוק הסיבה שה-E2E נשאר
 * מחוץ לשער ה-CI עד עכשיו.
 *
 * לכן: משתמשים בנתיב הקבוע רק כשהוא קיים בפועל, ואחרת נותנים ל-Playwright
 * לפתור את הדפדפן שהוא עצמו התקין (`playwright install chromium`). אין כאן
 * הבדל התנהגותי בין הסביבות — אותו Chromium, אותן בדיקות; רק מקור הבינארי
 * נקבע לפי מה שקיים במכונה.
 */
const PINNED_CHROMIUM = "/opt/pw-browsers/chromium";
const chromiumLaunchOptions = existsSync(PINNED_CHROMIUM)
  ? { executablePath: PINNED_CHROMIUM }
  : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // ב-CI מתווסף דוח HTML לצד ה-list: כשריצה נכשלת מרחוק אין למי להסתכל
  // בטרמינל, והדוח (יחד עם ה-trace והצילום) הוא כל מה שנשאר לאבחון. `open:
  // never` — אסור ש-CI ינסה לפתוח דפדפן בסוף הריצה ויתקע את ה-job.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    // נוצר רק כשבדיקה נכשלת, ולכן ריצה ירוקה אינה מייצרת דבר.
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: FREE_TEXT_SPEC,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumLaunchOptions,
      },
    },
    {
      // המשטח החופשי של „שאל את הספר” קיים רק כשדגל העוזר דלוק בשרת, ולכן הוא
      // נבדק מול השרת השני (3101). המשטח המודרך (3100) נשאר בדיוק כשהיה.
      name: "chromium-free-text",
      testMatch: FREE_TEXT_SPEC,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3101",
        launchOptions: chromiumLaunchOptions,
      },
    },
  ],
  // שני השרתים עולים *לפי הסדר* (Playwright מפעיל תוסף-שרת אחד בכל פעם), ולכן
  // ה-build של הראשון כבר קיים כשהשני מריץ `next start` — אין שתי בניות במקביל.
  webServer: [
    {
      command: "npm run build && npm run start -- -p 3100",
      url: "http://localhost:3100",
      // ב-CI תמיד `false` (GitHub מציב CI=true), ולכן שרת קודם לעולם אינו
      // ממוחזר: הבדיקות רצות מול build טרי או שהריצה נכשלת. זהו *חסם עליון*
      // להמתנה, לא השהיה — כשהשרת מוכן מוקדם, ההמתנה נגמרת מוקדם.
      reuseExistingServer: !process.env.CI,
      // 180 שניות הספיקו למכונת-פיתוח חמה. runner של GitHub בונה קר, בלי
      // מטמון `.next`, ועל מעבד איטי יותר — 59 עמודים סטטיים לוקחים שם הרבה
      // יותר. מרווח רחב עדיף על כשל-זמן מזדמן שאינו מעיד על שום תקלה אמיתית.
      timeout: 300_000,
      // מאגרים בזיכרון לבדיקות בלבד (לא DB אמיתי): רשימת המתנה + הפעלות ערכת
      // הקורא. READER_ACCESS_CODES הוא קוד-בדיקה בלבד לשרת הארעי (מפעיל את זרימת
      // ה-E2E מקצה-לקצה). SALES_ENABLED נשאר כבוי (Pre-launch).
      env: {
        WAITLIST_ALLOW_MEMORY: "true",
        READER_ALLOW_MEMORY: "true",
        READER_ACCESS_CODES: "MEETINGS-2026",
      },
    },
    {
      // אותו build, עם דגל התצוגה של העוזר בלבד — כדי שהממשק החופשי יהיה קיים
      // לבדיקה. אין כאן מסד, אין מפתח ספק ואין קריאה אמיתית למודל: הבדיקות
      // מיירטות את /api/compass ושולטות רק בתזמון ובגוף התשובה.
      command: "npm run start -- -p 3101",
      url: "http://localhost:3101",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { WAITLIST_ALLOW_MEMORY: "true", COMPASS_ASSISTANT_ENABLED: "true" },
    },
  ],
});
