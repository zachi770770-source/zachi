import { describe, it, expect } from "vitest";

import { askStations, dilemmas, dilemmasFor } from "@/content/askRoute";
import { stations, stationOrder } from "@/content/stations";
import { personas } from "@/content/personas";
import { patterns, attachment } from "@/content/book";

/**
 * בדיקות רגרסיית-איחוד: מוודאות ששתי שכבות-העבודה חיות יחד ואף אחת אינה נמחקת
 * בטעות ע"י שינוי בשכבה האחרת. אם עריכה עתידית מפילה פיצ׳ר מ„המסע הרגשי” (מנוע
 * „שאל את הספר”, פרק ב', פרסונות, מקטעי ההיכרות-העצמית) או ממבנה שלוש-התחנות —
 * אחת הבדיקות כאן תיפול.
 */

describe("מנוע „שאל את הספר” (AskRoute) — שלמות", () => {
  it("ארבע תחנות עם שמות התצוגה המאושרים", () => {
    const byId = Object.fromEntries(askStations.map((s) => [s.id, s.name]));
    expect(byId.dating).toBe("לפני קשר");
    expect(byId.building).toBe("בניית קשר");
    expect(byId.existing).toBe("בתוך קשר");
    expect(byId["after-breakup"]).toBe("אחרי פרידה");
  });

  it("19 דילמות, לכל תחנה יש לפחות אחת", () => {
    expect(dilemmas).toHaveLength(19);
    for (const s of askStations) {
      expect(dilemmasFor(s.id).length).toBeGreaterThan(0);
    }
  });

  it("כל דילמה מחזירה תשובה מלאה (מנוע שלוש/ארבע השאלות)", () => {
    for (const d of dilemmas) {
      expect(d.answer.reflection.length).toBeGreaterThan(0);
      expect(d.answer.distinction.length).toBeGreaterThan(0);
      expect(d.answer.checks.length).toBeGreaterThan(0);
      expect(d.answer.action.length).toBeGreaterThan(0);
      expect(d.answer.avoid.length).toBeGreaterThan(0);
      expect(d.answer.sampleStation).toBeTruthy();
    }
  });

  it("שכבת פרק ב' קיימת בכל שלוש תחנות הקשר (לפני/בניית/בתוך)", () => {
    for (const station of ["dating", "building", "existing"] as const) {
      const hasChapter2 = dilemmasFor(station).some((d) =>
        d.context?.options.some((o) => o.adapt?.note?.includes("פרק ב'")),
      );
      expect(hasChapter2, `פרק ב' חסר בתחנה ${station}`).toBe(true);
    }
  });
});

describe("מבנה התחנות — שלוש תחנות + שער מעבר", () => {
  it("חמשת עמודי-התחנה קיימים", () => {
    for (const id of [
      "before-relationship",
      "building-relationship",
      "inside-relationship",
      "after-breakup",
      "starting-again",
    ] as const) {
      expect(stations[id], `חסר עמוד ${id}`).toBeTruthy();
      expect(stations[id].metaTitle.length).toBeGreaterThan(0);
      expect(stations[id].metaDescription.length).toBeGreaterThan(0);
    }
  });

  it("stationOrder = שלוש התחנות המרכזיות בלבד", () => {
    expect(stationOrder).toEqual([
      "before-relationship",
      "building-relationship",
      "inside-relationship",
    ]);
  });

  it("שמות התחנות נשמרו; „אחרי פרידה” הוא שער מעבר שמקשר קדימה", () => {
    expect(stations["before-relationship"].navLabel).toBe("לפני קשר");
    expect(stations["inside-relationship"].navLabel).toBe("בתוך קשר");
    expect(stations["after-breakup"].eyebrow).toBe("שער מעבר");
    expect(stations["after-breakup"].related).toContain("starting-again");
  });
});

describe("פיצ׳רים מ„המסע הרגשי” שאסור שייעלמו", () => {
  it("שכבת ארבע הפרסונות קיימת", () => {
    expect(personas.length).toBe(4);
  });

  it("מקטעי ההיכרות-העצמית בעמוד הספר קיימים (דפוסים + ריקוד ההיקשרות)", () => {
    expect(patterns.rows.length).toBeGreaterThan(0);
    expect(attachment.styles.length).toBeGreaterThan(0);
  });
});
