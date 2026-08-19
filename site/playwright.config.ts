import { defineConfig, devices } from "@playwright/test";

/** הבדיקות של המשטח החופשי — רצות רק מול השרת עם דגל העוזר (ראו projects). */
const FREE_TEXT_SPEC = /compass-free-text-live\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: FREE_TEXT_SPEC,
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: "/opt/pw-browsers/chromium",
        },
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
        launchOptions: {
          executablePath: "/opt/pw-browsers/chromium",
        },
      },
    },
  ],
  // שני השרתים עולים *לפי הסדר* (Playwright מפעיל תוסף-שרת אחד בכל פעם), ולכן
  // ה-build של הראשון כבר קיים כשהשני מריץ `next start` — אין שתי בניות במקביל.
  webServer: [
    {
      command: "npm run build && npm run start -- -p 3100",
      url: "http://localhost:3100",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      // מאגר רשימת המתנה בזיכרון לבדיקות בלבד (לא DB אמיתי). SALES_ENABLED נשאר
      // כבוי כדי לבדוק את מצב ה-Pre-launch.
      env: { WAITLIST_ALLOW_MEMORY: "true" },
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
