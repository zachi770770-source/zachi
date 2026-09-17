import { describe, expect, it } from "vitest";

import { love } from "@/content/love";
import { BOOK_EXCERPTS } from "@/content/bookExcerpts";
import { canonicalExcerpt } from "@/content/sample";
import { guides } from "@/content/guides";

/**
 * ‎/love‎ הוא הבעלים היחיד של מונח-הראש „אהבה”.
 *
 * הבדיקות כאן מקבעות את מה שקל לאבד בשקט בפאס תוכן עתידי: שהמונח נשאר ראשון
 * בכותרת, שה-H1 לא „מתייפה” עד שהנושא נעלם ממנו, שהמסגרת מצטטת את כתב-היד
 * ולא ניסוח שנכתב כאן, ושהאשכול ממשיך להצביע פנימה.
 */
const TERM = "אהבה";

describe("‏/love — בעלות על מונח-הראש", () => {
  it("המונח המדויק פותח את הכותרת", () => {
    expect(love.meta.title.startsWith(TERM)).toBe(true);
  });

  it("הכותרת נשארת באורך שאינו נחתך בלי הצורך", () => {
    // כולל סיומת-המותג שמתווספת בתבנית.
    const full = `${love.meta.title} | מדייטים לאהבה`;
    expect(full.length).toBeLessThanOrEqual(70);
  });

  it("הכותרת מכסה את שלוש כוונות-החיפוש שהעמוד באמת עונה עליהן", () => {
    for (const intent of ["מהי אהבה", "בונים", "שומרים"]) {
      expect(love.meta.title).toContain(intent);
    }
  });

  it("ה-H1 נשאר בדיוק כפי שאושר, והמונח בתוכו", () => {
    expect(love.hero.h1).toBe("אהבה: לא רק מרגישים אותה. בונים אותה.");
    expect(love.hero.h1.startsWith(TERM)).toBe(true);
  });

  it("הפתיחה עונה „מהי אהבה” בלי לומר אותו דבר שלוש פעמים", () => {
    const opening = [...love.hero.lead, love.hero.intro, ...love.shortAnswer.body].join(" ");
    // התשובה קיימת.
    expect(opening).toContain(TERM);
    // ואינה חוזרת: „מה שנשאר אחרי שההתלהבות הראשונה נרגעת” הוא ניסוח-ההגדרה,
    // והוא רשאי להופיע פעם אחת בלבד בפתיחה.
    const marker = "ההתלהבות הראשונה נרגעת";
    const hits = opening.split(marker).length - 1;
    expect(hits).toBeLessThanOrEqual(1);
  });
});

describe("‏/love — המסגרת היא ציטוט, לא ניסוח חדש", () => {
  /**
   * „מילה במילה מהמקור” פירושו רצף *רציף* של המקור — לא בהכרח שורה בודדת.
   * ציטוט יכול לאחד שתי שורות שנמסרו כשהן שורות-תצוגה של משפט אחד
   * („הכימיה פותחת את הדלת — / העקביות מחזיקה את הבית.”), אבל לעולם לא
   * לדלג, לקצר או לצרף חלקים שאינם סמוכים. לכן נבנים כאן כל הרצפים
   * הרציפים, וכל דבר אחר ייפול.
   */
  const runs = (lines: readonly string[]) => {
    const out: string[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      for (let j = i; j < lines.length; j += 1) {
        out.push(lines.slice(i, j + 1).join(" "));
      }
    }
    return out;
  };
  const approved = [
    ...BOOK_EXCERPTS.flatMap((e) => runs(e.lines)),
    ...canonicalExcerpt.paragraphs,
    ...canonicalExcerpt.paragraphs.flatMap((p) => runs(p.split(". "))),
  ];

  it("יש בה שישה שלבים לפי סדר", () => {
    expect(love.framework.steps).toHaveLength(6);
    expect(love.framework.steps.map((s) => s.name)).toEqual([
      "משיכה",
      "עקביות",
      "אמון",
      "ביטחון",
      "גבולות",
      "תיקון ובחירה חוזרת",
    ]);
  });

  it("כל ציטוט הוא מחרוזת מאושרת מהמקור, מילה במילה", () => {
    for (const step of love.framework.steps) {
      const found = approved.some((a) => a.trim() === step.quote.trim());
      expect(found, `ציטוט שאינו מהמקור המאושר: "${step.quote}"`).toBe(true);
    }
  });

  it("אין כפילות בין הציטוטים", () => {
    const q = love.framework.steps.map((s) => s.quote);
    expect(new Set(q).size).toBe(q.length);
  });
});

describe("‏/love — עומק ואי-כפילות", () => {
  const ids = love.sections.map((s) => s.id);

  it("הכוונות שהיו חסרות קיימות עכשיו", () => {
    for (const id of ["trust-and-safety", "boundaries-in-love", "what-love-is-not", "repair"]) {
      expect(ids).toContain(id);
    }
  });

  it("אין מזהה כפול ואין כותרת כפולה", () => {
    expect(new Set(ids).size).toBe(ids.length);
    const headings = love.sections.map((s) => s.heading);
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("כל מקטע מפנה למקום אחר — אין שני מקטעים שמקשרים לאותו יעד", () => {
    const hrefs = love.sections.map((s) => s.link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("אשכול-האהבה מצביע אל /love", () => {
  const referring = Object.values(guides).filter((g) =>
    g.related.some((r) => r.href === "/love"),
  );

  it("מדריכי כוונת-אהבה מקשרים פנימה", () => {
    expect(referring.length).toBeGreaterThanOrEqual(11);
  });

  it("העוגנים מגוונים — אין חזרה על אותו טקסט-עוגן", () => {
    const anchors = Object.values(guides)
      .flatMap((g) => g.related)
      .filter((r) => r.href === "/love")
      .map((r) => r.label);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it("כל עוגן תיאורי, ואף אחד אינו המונח העירום בלבד", () => {
    const anchors = Object.values(guides)
      .flatMap((g) => g.related)
      .filter((r) => r.href === "/love")
      .map((r) => r.label);
    for (const a of anchors) {
      expect(a.length).toBeGreaterThan(TERM.length + 4);
    }
  });
});
