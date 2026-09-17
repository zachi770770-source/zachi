import { describe, it, expect } from "vitest";

import { authorContent } from "@/content/author";
import { outcomes, preview } from "@/content/book";
import { canonicalExcerpt } from "@/content/sample";
import { authorNote, recognition, whyTheBook } from "@/content/homeStory";

/**
 * עמוד הבית מוכר ספר, ולכן הפיתוי לכתוב עליו קופי משכנע גדול במיוחד. הבדיקות
 * כאן קושרות כל טענה בעמוד לטקסט מאושר שכבר קיים במאגר התוכן, כדי שרגרסיה
 * עתידית לא תוכל להחליק פנימה ביוגרפיה, סמכות או ציטוט „מהספר” שלא נכתבו שם.
 */
describe("home story is source-backed, not authored marketing copy", () => {
  it("quotes the book verbatim, not a paraphrase of it", () => {
    // פסקת המבוא המאושרת שפונה לכל ארבע התחנות (מוגנת ב-canonicalExcerpt.test.ts).
    expect(recognition.quote).toBe(canonicalExcerpt.paragraphs[2]);
  });

  it("shows at most three outcome lines, each approved copy verbatim", () => {
    // המקטע עבר מרשימת תוכן-העניינים לשלוש אמירות-תוצאה. הכלל לא נחלש: כל
    // שורה חייבת להיות מילה במילה מתוך `outcomes.items` המאושר — אין כאן
    // ניסוח חדש, ואי-אפשר להחליק פנימה הבטחה שיווקית שלא אושרה.
    expect(whyTheBook.book.lines.length).toBeLessThanOrEqual(3);
    for (const line of whyTheBook.book.lines) {
      expect(outcomes.items).toContain(line);
    }
    // שלוש שאלות שונות, לא אותה שאלה שלוש פעמים.
    expect(new Set(whyTheBook.book.lines).size).toBe(whyTheBook.book.lines.length);
  });

  it("keeps the approved table of contents intact, not invented chapters", () => {
    expect(whyTheBook.tableOfContents).toEqual(preview.tableOfContents.slice(1));
  });

  it("keeps the author beat as approved site copy, free of promises", () => {
    // הוחלף מציטוט-ביו לקופי-אתר מאושר (הרעיון שממנו נכתב הספר) — בלי ביוגרפיה
    // שלא קיימת ובלי הבטחות. הבדיקה מקבעת את הניסוח המאושר ושומרת על הגבול.
    expect(authorNote.body).toContain("אותו מסע");
    expect(authorNote.bodyClose).toContain("בלי נוסחאות ובלי הבטחות קסם");
    const beat = `${authorNote.body} ${authorNote.bodyClose}`;
    for (const banned of ["מבטיח", "מובטח", "בוודאות", "תרפא", "ירפא", "פתרון מובטח"]) {
      expect(beat).not.toContain(banned);
    }
  });

  it("keeps the author heading the approved one", () => {
    expect(authorNote.title).toBe(authorContent.sectionTitle);
  });

  it("states the explicit boundary and claims no profession", () => {
    expect(authorNote.boundary).toContain("לא טיפול");
    expect(authorNote.boundary).toContain("לא אבחון");
    const everything = [
      recognition.line,
      recognition.support,
      whyTheBook.title,
      whyTheBook.site.line,
      authorNote.body,
      authorNote.bodyClose,
    ].join(" ");
    for (const banned of ["פסיכולוג", "מטפל", "מוסמך", "תואר", "קליני"]) {
      expect(everything).not.toContain(banned);
    }
  });

  it("does not restate the H1 thesis outside the book's own quote", () => {
    // „חיפוש מול בנייה” הוא משפט ה-H1. הוא נוחת פעם אחת בעמוד — בציטוט מהספר.
    const authored = [
      recognition.line,
      whyTheBook.title,
      whyTheBook.subtitle,
      whyTheBook.site.line,
      whyTheBook.book.note,
      authorNote.body,
      authorNote.bodyClose,
    ].join(" ");
    expect(authored).not.toMatch(/לחפש|מחפשים|מוצאים/);
    // שורת-המשנה מונה את ארבע התחנות ולכן רשאית לנקוב ב„מחפשים קשר” כשלב-חיים —
    // אך עדיין אסור לה לשחזר את צד ה„מציאה” של תזת ה-H1.
    expect(recognition.support).not.toMatch(/מוצאים|למצוא/);
    // משפט-הגשר מונה קהלים ולכן רשאי לומר „מחפשים” — באותו היתר ומאותה סיבה.
    expect(recognition.audienceBridge).not.toMatch(/מוצאים|למצוא/);
  });

  /**
   * הליקוי שהפאס הזה בא לתקן: העמוד נקרא כספר-דייטינג, ומי שנשוי חמש-עשרה
   * שנה לא ראה בחצי הראשון שום סימן שהספר מדבר גם אליו. הבדיקה מקבעת שרוחב
   * הקהל נאמר במפורש — פעם אחת, במשפט אחד, ולא כארבעה כרטיסי-קהל.
   */
  it("names every audience once, in one editorial sentence", () => {
    const bridge = recognition.audienceBridge;
    for (const stage of ["מחפשים", "מתחילים מחדש", "בתחילתו של קשר", "שנים יחד"]) {
      expect(bridge).toContain(stage);
    }
    // משפט אחד, לא באנר ולא רשימה.
    expect(bridge.split(".").filter((s) => s.trim()).length).toBe(1);
  });

  it("keeps the practical value spanning the whole journey, in three lines", () => {
    // לבחור → לבנות → להעמיק קשר קיים. אם השלוש יתכווצו שוב לשלב אחד, העמוד
    // ייגמר מבחינת הקורא הוותיק לפני שהתחיל.
    expect(whyTheBook.book.lines).toHaveLength(3);
    expect(whyTheBook.book.lines[0]).toContain("פחד או הרגל");
    expect(whyTheBook.book.lines[1]).toContain("אמון וקרבה");
    expect(whyTheBook.book.lines[2]).toContain("קשר קיים");
  });

  it("leads with the reader, not with the product", () => {
    // „האתר עונה על שאלה. הספר מלווה תהליך.” נכון — אבל הנושא שלו הוא המוצר.
    // הוא שורד כטקסט-משנה; הכותרת מדברת אל הקורא.
    expect(whyTheBook.title).not.toContain("האתר");
    expect(whyTheBook.subtitle).toContain("האתר");
  });
});
