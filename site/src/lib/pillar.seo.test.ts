import { describe, expect, it } from "vitest";

import { pillarForStage } from "@/lib/pillar";
import { love } from "@/content/love";
import { dating } from "@/content/dating";

/**
 * שמירות-SEO על שני עמודי-האב.
 *
 * הבדיקות כאן נולדו משני ליקויים *שנמדדו* בזחילה מרונדרת, לא מתחושה:
 *   1. ‎/dating‎ היה כמעט יתום (5 קישורים מול 39 ל-‎/love‎).
 *   2. אחרי התיקון הראשון האיזון הוסדר, אבל 9 מתוך 13 הקישורים אל ‎/dating‎
 *      נשאו עוגן זהה — בדיוק דפוס ה„exact-match” שיש להימנע ממנו.
 */

const SEARCH_STAGES = ["before-relationship", "starting-again"] as const;
const BUILD_STAGES = ["building-relationship", "inside-relationship", "after-breakup"] as const;

describe("מיפוי עמודי-האב לפי שלב", () => {
  it.each(SEARCH_STAGES)("שלב-חיפוש %s מפנה אל /dating", (stage) => {
    expect(pillarForStage(stage).href).toBe("/dating");
  });

  it.each(BUILD_STAGES)("שלב-בנייה %s מפנה אל /love", (stage) => {
    expect(pillarForStage(stage).href).toBe("/love");
  });

  /** עמוד שיושב על אב אחד מקבל את השני — קישור הדדי, לא קישור עצמי. */
  it("עמוד-אב מקבל את עמוד-האב השני ולא את עצמו", () => {
    expect(pillarForStage("/dating").href).toBe("/love");
    expect(pillarForStage("/love").href).toBe("/dating");
  });

  it("אין הטיה שיטתית: לא כל השלבים מפנים לאותו אב", () => {
    const all = [...SEARCH_STAGES, ...BUILD_STAGES].map((s) => pillarForStage(s).href);
    expect(new Set(all).size).toBe(2);
  });
});

/**
 * ── חזרת-העוגן אל עמודי-האב: נבדקה והוחלט לא לשנות ────────────────────────
 * מדידה ישירה (קריאה ל-‎pillarForStage‎ על כל המדריכים, לא זחילה): תשעה
 * מדריכים מפנים אל ‎/dating‎ ו-14 אל ‎/love‎ — וכל קבוצה נושאת **תווית אחת**.
 *
 * בסבב קודם דיווחתי על זה כליקוי וכתבתי תיקון של תוויות-לפי-שלב. שתי טעויות
 * היו שם: מדדתי בזחילה מול שרת שלא הוגש ממנו ה-build העדכני (ומכאן „התיקון
 * לא נכנס”), והצגתי את החזרה כדפוס „exact-match”.
 *
 * בבדיקה חוזרת זו אינה בעיה שראוי לתקן:
 *   • העוגן הוא משפט תיאורי („התמונה הרחבה: …”), לא מונח-חיפוש דחוס. חזרה
 *     על מילת-מפתח עירומה היא הדפוס הבעייתי — לא תווית ניווט תיאורית.
 *   • זהו קישור-ניווט קבוע בתחתית כל מדריך, כמו פירורי-לחם. עקביות שם היא
 *     יתרון לקורא, לא ליקוי.
 *   • שבעה מתוך התשעה חולקים את אותו ‎hub‎ (‎/before-relationship‎) — כלומר
 *     אותו הקשר בדיוק. תווית שונה לכל אחד הייתה גיוון מלאכותי למען אלגוריתם.
 *
 * לכן: אין כאן בדיקה שמקבעת „מספר תוויות שונות”. מה שכן נשמר למטה הוא
 * המיפוי עצמו — שהוא מה שבאמת חשוב: ששלב-חיפוש יגיע ל-‎/dating‎ ולא הכול
 * ייצבר על ‎/love‎, כפי שקרה פעם (5 מול 39).
 */

describe("בעלות על כוונת-החיפוש הרחבה", () => {
  it("‏/love פותח ב„אהבה”, /dating פותח ב„דייטים”", () => {
    expect(love.meta.title.startsWith("אהבה")).toBe(true);
    expect(dating.meta.title.startsWith("דייטים")).toBe(true);
  });

  it("‏H1 יחיד ומובחן לכל אב — אין קניבליזציה בין השניים", () => {
    expect(love.hero.h1).not.toBe(dating.hero.h1);
    expect(love.hero.h1).toContain("אהבה");
    expect(dating.hero.h1).toContain("דייטים");
  });

  it("תיאורי-המטא קיימים ובאורך סביר לתצוגה", () => {
    for (const d of [love.meta.description, dating.meta.description]) {
      expect(d.length).toBeGreaterThanOrEqual(70);
      expect(d.length).toBeLessThanOrEqual(175);
    }
  });
});
