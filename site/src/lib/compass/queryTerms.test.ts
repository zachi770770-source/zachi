import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { splitQueryTerms } from "@/lib/compass/search";

const all = (q: string) => {
  const { original, derived } = splitQueryTerms(q);
  return [...original, ...derived];
};

describe("splitQueryTerms: מילות-פונקציה צמודות ל-ש של משפט-זיקה", () => {
  it.each(["שהוא", "שהיא", "כשהוא", "שזה", "שלא", "שאין", "ושהם"])("„%s” אינו מונח-תוכן", (w) => {
    expect(all(`${w} רציני`)).toEqual(["רציני"]);
  });

  it("„שאלה” ו„שכל” נשארות מילות-תוכן (לא ש+אלה / ש+כל)", () => {
    expect(all("שאלה")).toContain("שאלה");
    expect(all("שכל")).toContain("שכל");
  });

  it("„משהו” ו„מישהו” הם כינויים סתמיים, לא מונחי-תוכן", () => {
    expect(all("משהו מישהו קשר")).toEqual(["קשר"]);
  });
});

describe("splitQueryTerms: קילוף-תחילית לא משחית מילה תקפה", () => {
  it("„משלם” אינו מוליד „שלם” (מילה אחרת: complete)", () => {
    const { original, derived } = splitQueryTerms("מי משלם בדייט ראשון?");
    expect(original).toContain("משלמ");
    expect([...original, ...derived]).not.toContain("שלמ");
  });

  it("„לשלם” (ל+שלם) עדיין מוליד „שלם” כנגזרת — ל היא תחילית אמיתית כאן", () => {
    expect(splitQueryTerms("לשלם").derived).toContain("שלמ");
  });
});
