import { describe, it, expect } from "vitest";

import { authorContent } from "@/content/author";
import { preview } from "@/content/book";
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

  it("lists the approved table of contents, not invented chapters", () => {
    expect(whyTheBook.book.lines).toEqual(preview.tableOfContents.slice(1));
  });

  it("takes the author beat verbatim from the approved bio", () => {
    // משפטים שלמים כלשונם — לא ניסוח מחדש ולא חיתוך באמצע משפט.
    expect(authorContent.fullBio[1]).toContain(authorNote.body);
    for (const sentence of authorNote.body.split(". ")) {
      expect(authorContent.fullBio[1]).toContain(sentence);
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
    ].join(" ");
    expect(authored).not.toMatch(/לחפש|מחפשים|מוצאים/);
    // שורת-המשנה מונה את ארבע התחנות ולכן רשאית לנקוב ב„מחפשים קשר” כשלב-חיים —
    // אך עדיין אסור לה לשחזר את צד ה„מציאה” של תזת ה-H1.
    expect(recognition.support).not.toMatch(/מוצאים|למצוא/);
  });
});
