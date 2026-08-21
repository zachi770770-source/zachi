import { describe, it, expect } from "vitest";

import { authorContent } from "@/content/author";
import { preview } from "@/content/book";
import { authorNote, recognition, whyTheBook } from "@/content/homeStory";

/**
 * עמוד הבית מוכר ספר, ולכן הפיתוי לכתוב עליו קופי משכנע גדול במיוחד. הבדיקות
 * כאן קושרות כל טענה בעמוד לטקסט מאושר שכבר קיים במאגר התוכן, כדי שרגרסיה
 * עתידית לא תוכל להחליק פנימה ביוגרפיה, סמכות או ציטוט „מהספר” שלא נכתבו שם.
 */
describe("home story is source-backed, not authored marketing copy", () => {
  it("quotes the book verbatim, not a paraphrase of it", () => {
    expect(recognition.quote).toBe(preview.homeTeaser);
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
      recognition.support,
      whyTheBook.title,
      whyTheBook.site.line,
      whyTheBook.book.note,
      authorNote.body,
    ].join(" ");
    expect(authored).not.toMatch(/לחפש|מחפשים|מוצאים/);
  });
});
