import { describe, it, expect } from "vitest";

import { groundSituation, DILEMMA_JOURNEY } from "@/lib/journey/ground";
import { JOURNEY_IDS } from "@/content/journeys";
import { PERSONA_IDS } from "@/content/personas";
import type { CompassMatch } from "@/lib/compass/types";

/**
 * שכבת העיגון: `toolSurfaced` נגזר מהחומר שהאחזור עיגן (+ dilemma), לא מה-journey;
 * `currentSituation` deterministic-first; ושניהם null כשאין התאמה בטוחה.
 */

const match = (content: string, sectionName = "", chapterName = "בחירה מפוכחת"): CompassMatch => ({
  chapterNumber: 4,
  chapterName,
  sectionName: sectionName || null,
  content,
  score: 0.6,
});

describe("groundSituation — הכלי מגיע מהאחזור, לא מה-journey", () => {
  it("חומר של ניצוץ אזעקה זמינים -> recurring-pattern מוביל ל-quiet-check", () => {
    const g = groundSituation({
      text: "אני שוב נמשך לאותו טיפוס",
      matches: [
        match(
          "הספר עוזר לזהות מתי הניצוץ הוא סימן להתאמה ומתי הוא אזעקה ישנה שלמדתם לקרוא לה משיכה. נמשכים לאנשים לא זמינים.",
          "האודישן ההפוך",
        ),
      ],
    });
    expect(g.currentSituation).toBe("recurring-pattern");
    expect(g.toolSurfaced?.slug).toBe("quiet-check");
    expect(g.toolSurfaced?.path).toBe("/method/quiet-check");
    expect(g.dilemmaId).toBe("d-unavailable");
  });

  it("חומר של משיכה מול ערכים ברזל -> deciding-continue מוביל ל-core-values", () => {
    const g = groundSituation({
      text: "אני מתלבט אם זה מתאים לי",
      matches: [
        match(
          "משיכה וערכים לא צריכים להילחם. בדקו אם שלושת ערכי הברזל עומדים כשהמשיכה שוקטת.",
          "שלושת ערכי הברזל",
        ),
      ],
    });
    expect(g.currentSituation).toBe("deciding-continue");
    expect(g.toolSurfaced?.slug).toBe("core-values");
    expect(g.dilemmaId).toBe("d-attraction-values");
  });

  it("אותו currentSituation (מטקסט) אך אחזור לא-תואם -> toolSurfaced=null (הכלי לא נגזר מהמסע)", () => {
    const g = groundSituation({
      text: "היא לא ענתה לי ארבע שעות, זה אומר שלא מעוניינת?",
      matches: [match("טקסט על נושא טכני לגמרי, כמה שמן צריך במנוע של מכונית.")],
    });
    // המצב מסווג מהטקסט (interpreting-signals), אבל הכלי לא מעוגן -> null.
    expect(g.currentSituation).toBe("interpreting-signals");
    expect(g.toolSurfaced).toBeNull();
    expect(g.dilemmaId).toBeNull();
  });

  it("אחזור לא-תואם לשום dilemma -> toolSurfaced=null", () => {
    const g = groundSituation({
      text: "שאלה כללית",
      matches: [match("כמה שמן צריך במנוע של מכונית מאזדה ואיזה צמיגים מומלצים לחורף.")],
    });
    expect(g.toolSurfaced).toBeNull();
    expect(g.dilemmaId).toBeNull();
  });

  it("אין matches כלל -> toolSurfaced=null, והמצב עדיין יכול להיקבע מהטקסט", () => {
    const g = groundSituation({ text: "אנחנו רבים שוב על אותו הדבר" });
    expect(g.toolSurfaced).toBeNull();
    expect(g.currentSituation).toBe("conflict-distance");
  });
});

describe("groundSituation — עקביות ומיפוי", () => {
  it("כל ערכי DILEMMA_JOURNEY הם JourneyId חוקיים וזרים ל-Persona", () => {
    for (const [, journey] of Object.entries(DILEMMA_JOURNEY)) {
      expect(JOURNEY_IDS as readonly string[]).toContain(journey);
      expect(PERSONA_IDS as readonly string[]).not.toContain(journey);
    }
  });

  it("כלי מעוגן תמיד מצביע לנתיב /method/<slug> אמיתי", () => {
    const g = groundSituation({
      text: "אותם ריבים חוזרים",
      matches: [
        match(
          "אותם ריבים חוזרים שוב ושוב על אותו נושא, ונוצר ריחוק ושגרה. שיחה בגובה העיניים.",
          "אותם ריבים",
        ),
      ],
    });
    expect(g.toolSurfaced).not.toBeNull();
    expect(g.toolSurfaced!.path).toBe(`/method/${g.toolSurfaced!.slug}`);
  });
});
