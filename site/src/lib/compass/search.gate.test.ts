import { describe, it, expect, vi } from "vitest";

// server-only זורק מחוץ להקשר RSC; בבדיקות מנטרלים אותו.
vi.mock("server-only", () => ({}));

import {
  passesConfidenceGate,
  splitQueryTerms,
  CONFIDENCE_MIN_ORIGINAL_TERMS,
  CONFIDENCE_MIN_AGREEING_TERMS,
} from "@/lib/compass/search";
import { expandText } from "@/lib/compass/hebrew";

/**
 * שער-הביטחון „I1” ברמת היחידה: שני התנאים, ההתנהגות בקצוות, והמנגנונים
 * שהוא אמור לחסום. הכיסוי מקצה-לקצה מול הקורפוס האמיתי נמצא
 * ב-retrieval.bench.test.ts (מותנה COMPASS_PG_URL).
 */

/** בונה DF לכל מונח שנמסר, ו-0 לשאר. */
const dfOf = (attested: string[], n = 5) => new Map(attested.map((t) => [t, n]));

describe("passesConfidenceGate", () => {
  it("הסף המתועד הוא 2 ו-2", () => {
    expect(CONFIDENCE_MIN_ORIGINAL_TERMS).toBe(2);
    expect(CONFIDENCE_MIN_AGREEING_TERMS).toBe(2);
  });

  it("עובר כששני מונחים מקוריים מעוגנים ושניהם מופיעים בקטעים", () => {
    expect(
      passesConfidenceGate({
        original: ["אמונ", "נבנה"],
        terms: ["אמונ", "נבנה"],
        df: dfOf(["אמונ", "נבנה"]),
        haystacks: ["אמונ נבנה לאט"],
      })
    ).toBe(true);
  });

  it("נכשל כשאין קטעים כלל", () => {
    expect(
      passesConfidenceGate({
        original: ["אמונ", "נבנה"],
        terms: ["אמונ", "נבנה"],
        df: dfOf(["אמונ", "נבנה"]),
        haystacks: [],
      })
    ).toBe(false);
  });

  // מנגנון B: שאריות-תחילית בלבד. אף מילה שהמשתמש כתב אינה מעוגנת בספר.
  it("נכשל כשרק מונחים נגזרים מעוגנים (שאריות-תחילית)", () => {
    expect(
      passesConfidenceGate({
        original: ["כוכבימ", "בגלקסיה"],
        terms: ["כוכבימ", "בגלקסיה", "וכבימ", "גלקסיה"],
        df: dfOf(["וכבימ", "גלקסיה"]),
        haystacks: ["וכבימ גלקסיה"],
      })
    ).toBe(false);
  });

  // מנגנון D: קלט חסר-תוכן — מונח מקורי אחד בלבד.
  it("נכשל על מונח-תוכן מקורי יחיד", () => {
    expect(
      passesConfidenceGate({
        original: ["יודע"],
        terms: ["יודע"],
        df: dfOf(["יודע"]),
        haystacks: ["מה שאני יודע על עצמי"],
      })
    ).toBe(false);
  });

  // מנגנון A: „וו יחיד” — מילה נדירה שמופיעה במקרה, בלי שום חיזוק בקטע.
  it("נכשל כשמונח מעוגן שני אינו מופיע בפועל בקטעים שנבחרו", () => {
    expect(
      passesConfidenceGate({
        original: ["שמרימ", "זמנ"],
        terms: ["שמרימ", "זמנ"],
        df: dfOf(["שמרימ", "זמנ"]),
        haystacks: ["הסעיף מדבר על שמרימ בלבד"], // „זמנ” אינו כאן
      })
    ).toBe(false);
  });

  it("מונח מקורי עם DF=0 אינו נספר כמעוגן", () => {
    expect(
      passesConfidenceGate({
        original: ["ויטמינימ", "בחורפ"],
        terms: ["ויטמינימ", "בחורפ"],
        df: new Map([
          ["ויטמינימ", 0],
          ["בחורפ", 0],
        ]),
        haystacks: ["ויטמינימ בחורפ"],
      })
    ).toBe(false);
  });

  it("מונח נגזר יכול להשלים את תנאי-ההסכמה, אך לא את תנאי-המקוריות", () => {
    const args = {
      original: ["בונימ", "אמונ"],
      terms: ["בונימ", "אמונ", "ונימ"],
      df: dfOf(["בונימ", "אמונ", "ונימ"]),
    };
    // שני מקוריים מעוגנים, אך רק אחד מהם + נגזר מופיעים בקטע → עדיין 2 מסכימים.
    expect(passesConfidenceGate({ ...args, haystacks: ["בונימ ונימ"] })).toBe(true);
    // מונח יחיד בקטע → נכשל.
    expect(passesConfidenceGate({ ...args, haystacks: ["בונימ בלבד"] })).toBe(false);
  });

  it("אינו סופר את אותו מונח פעמיים כשהוא חוזר גם ב-original וגם ב-terms", () => {
    expect(
      passesConfidenceGate({
        original: ["אמונ", "אמונ"],
        terms: ["אמונ", "אמונ"],
        df: dfOf(["אמונ"]),
        haystacks: ["אמונ אמונ אמונ"],
      })
    ).toBe(false);
  });
});

/**
 * ארבע שאלות-הפתיחה שהאתר עצמו מציע („התחילו מאחת מאלה”) חייבות לעבור את
 * השער: משתמש שלוחץ על צ׳יפ שהאתר הציע ומקבל „לא מצאתי בספר בסיס מספיק” הוא
 * תקלה גלויה. כאן נבדק רק תנאי-המקוריות, שאינו תלוי בקורפוס; תנאי-ההסכמה
 * נבדק מול הספר האמיתי ב-retrieval.bench.test.ts.
 */
describe("שאלות-הפתיחה של האתר עוברות את תנאי-המקוריות", () => {
  const STARTERS = [
    "אני לא יודע אם להמשיך את הקשר",
    "אנחנו רבים על אותו דבר שוב ושוב",
    "אני נמשך דווקא למי שלא באמת זמין",
    "אני אחרי פרידה ולא יודע אם לחזור",
  ];

  for (const q of STARTERS) {
    it(`„${q}”`, () => {
      const { original, derived } = splitQueryTerms(q);
      const all = [...original, ...derived];
      expect(
        passesConfidenceGate({
          original,
          terms: all,
          df: dfOf(all),
          haystacks: [expandText(q)],
        })
      ).toBe(true);
    });
  }
});
