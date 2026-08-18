import { test, expect } from "@playwright/test";

/**
 * Phase 1 — גבול הבטיחות של השאלה-החופשית.
 *
 * שרת-הבדיקות רץ בתצורת ברירת-המחדל (בלי דגלי compass), כלומר מצב-התצוגה הוא
 * "guided" — בדיוק כמו פרודקשן. הבדיקות כאן מוודאות שהמצפן המודרך פעיל ושה*ממשק
 * החופשי הלא-גמור אינו נחשף* בפרודקשן, בשלושה רוחבים. מצבי ה-Preview/Live
 * (uiPreview / עוזר-פעיל) מכוסים בבדיקות היחידה (הם דורשים דגלי-שרת).
 */

const WIDTHS = [360, 390, 1280];

test.describe("compass /compass — production surface is guided-only", () => {
  for (const w of WIDTHS) {
    test(`w=${w}: guided compass renders, no free-text textarea exposed, no overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/compass", { waitUntil: "networkidle" });

      // המנוע המודרך מוצג (בורר התחנה).
      await expect(
        page.getByRole("heading", { name: "איפה אתם עכשיו?" }),
      ).toBeVisible();

      // הממשק החופשי (תיבת הכתיבה) אינו נחשף בפרודקשן.
      await expect(page.getByLabel("כתבו כאן במילים שלכם")).toHaveCount(0);

      // אין ניסוח שמרמז על צ׳אט חופשי / שיחה עם AI.
      await expect(page.getByText(/צ.אט|בינה מלאכות|שיחה עם/)).toHaveCount(0);

      // אין גלישה אופקית ברוחב הזה.
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      );
      expect(overflow).toBe(false);
    });
  }
});
