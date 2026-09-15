import { describe, expect, it } from "vitest";

import { guides } from "@/content/guides";
import { auditGuideIndex, guideStages } from "@/content/guideIndex";

/**
 * אינדקס המדריכים הוא נקודת-הגילוי היחידה של האשכול כולו: משם מגיעים הקורא
 * והזחלן אל עשרים ושלושה מדריכים שאינם בתפריט הראשי. מדריך שנשמט ממנו אינו
 * שובר דבר בבנייה — הוא פשוט מפסיק להתגלות, בשקט. הבדיקות כאן הופכות את
 * השקט הזה לכישלון גלוי.
 */
describe("אינדקס המדריכים", () => {
  it("כולל כל מדריך קיים, בדיוק פעם אחת", () => {
    const { missing, duplicated } = auditGuideIndex();
    expect(missing, `מדריכים שאינם מופיעים באינדקס: ${missing.join(", ")}`).toEqual([]);
    expect(duplicated, `מדריכים שמופיעים פעמיים: ${duplicated.join(", ")}`).toEqual([]);
  });

  it("אינו מפנה לסלאג שאינו קיים", () => {
    const unknown = guideStages
      .flatMap((s) => s.slugs)
      .filter((slug) => !guides[slug]);
    expect(unknown, `סלאגים שאינם קיימים: ${unknown.join(", ")}`).toEqual([]);
  });

  it("לכל שלב יש כותרת, משפט-פתיחה ולפחות מדריך אחד", () => {
    for (const stage of guideStages) {
      expect(stage.title.length, stage.id).toBeGreaterThan(2);
      expect(stage.lead.length, stage.id).toBeGreaterThan(20);
      expect(stage.slugs.length, stage.id).toBeGreaterThan(0);
    }
  });
});
