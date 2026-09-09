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
      whyTheBook.site.line,
      whyTheBook.book.note,
      authorNote.body,
      authorNote.bodyClose,
    ].join(" ");
    expect(authored).not.toMatch(/לחפש|מחפשים|מוצאים/);
    // שורת-המשנה מונה את ארבע התחנות ולכן רשאית לנקוב ב„מחפשים קשר” כשלב-חיים —
    // אך עדיין אסור לה לשחזר את צד ה„מציאה” של תזת ה-H1.
    expect(recognition.support).not.toMatch(/מוצאים|למצוא/);
  });
});
