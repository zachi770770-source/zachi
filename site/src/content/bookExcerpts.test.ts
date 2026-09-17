import { describe, expect, it } from "vitest";

import {
  BOOK_EXCERPTS,
  CYCLE_LENGTH,
  EDITORIAL_ORDER,
  excerptAt,
  excerptById,
  excerptOrder,
  MIN_SEPARATION,
} from "@/content/bookExcerpts";

/**
 * הבדיקות כאן מקבעות את התכונה שהכי קל לאבד בשקט: שספר-ההירו יקרוס בחזרה
 * לתוכן חוזר. לפני הפאס הזה היו שלוש כפולות שהתחלפו ב-‎n % 3‎, כלומר כל דפדוף
 * שלישי הציג בדיוק את אותו טקסט. שינוי עתידי שיצמצם את המאגר, ישכפל ציטוט,
 * או יערבב את המחזור הראשון — ייפול כאן ולא יתגלה בעין.
 */
describe("מאגר-הציטוטים של ספר-ההירו", () => {
  it("מכיל בדיוק 24 ציטוטים מאושרים", () => {
    expect(BOOK_EXCERPTS).toHaveLength(24);
    expect(CYCLE_LENGTH).toBe(24);
  });

  it("המזהים רצופים ויחידים (1..24)", () => {
    const ids = BOOK_EXCERPTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice().sort((a, b) => a - b)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
  });

  it("אין שני ציטוטים זהים בניסוחם", () => {
    const texts = BOOK_EXCERPTS.map((e) => e.lines.join("\n"));
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("כל ציטוט הוא לפחות שורה אחת, ואין שורות ריקות או רווחי-קצה", () => {
    for (const e of BOOK_EXCERPTS) {
      expect(e.lines.length).toBeGreaterThan(0);
      for (const line of e.lines) {
        expect(line).toBe(line.trim());
        expect(line.length).toBeGreaterThan(0);
      }
    }
  });

  it("אף ציטוט אינו נושא מספר-עמוד או שיוך-עימוד", () => {
    // המצאת עימוד היא המצאת שיוך. המבנה עצמו לא מאפשר את זה — וזו הכוונה.
    for (const e of BOOK_EXCERPTS) {
      expect(e).not.toHaveProperty("pageNo");
      expect(e).not.toHaveProperty("page");
    }
  });
});

describe("סדר-המחזור הראשון", () => {
  it("הוא הרצף העריכתי המדויק שנמסר, ולא ערבוב", () => {
    expect(EDITORIAL_ORDER).toEqual([
      1, 3, 4, 5, 7, 23, 22, 24, 8, 9, 10, 11, 12, 6, 13, 14, 15, 16, 17, 19, 2, 18, 21, 20,
    ]);
    expect(excerptOrder(0)).toEqual(EDITORIAL_ORDER);
  });

  it("מכסה את כל המאגר בדיוק פעם אחת", () => {
    expect(new Set(EDITORIAL_ORDER).size).toBe(CYCLE_LENGTH);
    expect(EDITORIAL_ORDER).toHaveLength(CYCLE_LENGTH);
  });

  it("עובר אשכול-אחר-אשכול: דפוס → דייטינג → רעש → כימיה → גבולות → בנייה", () => {
    const seen: string[] = [];
    for (const id of EDITORIAL_ORDER) {
      const c = excerptById(id).cluster;
      if (seen[seen.length - 1] !== c) seen.push(c);
    }
    expect(seen).toEqual([
      "pattern",
      "dating",
      "noise",
      "chemistry",
      "boundaries",
      "building",
    ]);
  });
});

describe("מחזורים נוספים", () => {
  it("כל מחזור הוא תמורה שלמה של המאגר — בלי חסר ובלי כפילות", () => {
    for (let cycle = 0; cycle < 40; cycle += 1) {
      const order = excerptOrder(cycle);
      expect(order).toHaveLength(CYCLE_LENGTH);
      expect(new Set(order).size).toBe(CYCLE_LENGTH);
    }
  });

  it("מחזור חדש אינו נפתח בציטוט שסגר את הקודם", () => {
    for (let cycle = 1; cycle < 40; cycle += 1) {
      const prev = excerptOrder(cycle - 1);
      expect(excerptOrder(cycle)[0]).not.toBe(prev[prev.length - 1]);
    }
  });

  it("מחזור חדש אינו נפתח באשכול שסגר את הקודם", () => {
    for (let cycle = 1; cycle < 40; cycle += 1) {
      const prev = excerptOrder(cycle - 1);
      const prevLast = excerptById(prev[prev.length - 1]).cluster;
      expect(excerptById(excerptOrder(cycle)[0]).cluster).not.toBe(prevLast);
    }
  });

  it("אינו חוזר על סדר-המחזור הראשון", () => {
    for (let cycle = 1; cycle < 12; cycle += 1) {
      expect(excerptOrder(cycle)).not.toEqual(EDITORIAL_ORDER);
    }
  });

  it("דטרמיניסטי: אותו מחזור נותן תמיד את אותו סדר", () => {
    for (let cycle = 0; cycle < 12; cycle += 1) {
      expect(excerptOrder(cycle)).toEqual(excerptOrder(cycle).slice());
      expect(excerptOrder(cycle)).toEqual([...excerptOrder(cycle)]);
    }
    // ריצה שנייה על מחזור רחוק, בלי לגעת בקודמים — חייבת להיות זהה.
    const a = [...excerptOrder(7)];
    const b = [...excerptOrder(7)];
    expect(a).toEqual(b);
  });
});

describe("זרם-הדפדוף האינסופי", () => {
  it("‏24 הדפדופים הראשונים הם 24 ציטוטים שונים, בסדר העריכתי", () => {
    const ids = Array.from({ length: CYCLE_LENGTH }, (_, n) => excerptAt(n).id);
    expect(ids).toEqual([...EDITORIAL_ORDER]);
    expect(new Set(ids).size).toBe(CYCLE_LENGTH);
  });

  it("‏12 הדפדופים הראשונים הם 12 ציטוטים שונים", () => {
    const ids = Array.from({ length: 12 }, (_, n) => excerptAt(n).id);
    expect(new Set(ids).size).toBe(12);
    expect(ids).toEqual([1, 3, 4, 5, 7, 23, 22, 24, 8, 9, 10, 11]);
  });

  it("כל מחזור מיושר הוא 24 ציטוטים שונים — המאגר מוצה לפני כל חזרה", () => {
    for (let cycle = 0; cycle < 8; cycle += 1) {
      const ids = Array.from(
        { length: CYCLE_LENGTH },
        (_, k) => excerptAt(cycle * CYCLE_LENGTH + k).id,
      );
      expect(new Set(ids).size).toBe(CYCLE_LENGTH);
    }
  });

  it(`בין שתי הופעות של אותו ציטוט יש לפחות ${MIN_SEPARATION} דפדופים — גם בתפר`, () => {
    // זו ההבטחה החזקה ביותר שאפשר לקיים *יחד עם* תמורה חדשה בכל מחזור:
    // חלון-נע מלא של 24 היה מחייב שכל המחזורים יהיו זהים (ראו ההוכחה
    // ב-`excerptOrder`), וזה בדיוק מה שהדרישה לערבוב אוסרת.
    const last = new Map<number, number>();
    for (let n = 0; n < CYCLE_LENGTH * 8; n += 1) {
      const { id } = excerptAt(n);
      const prev = last.get(id);
      if (prev !== undefined) expect(n - prev).toBeGreaterThanOrEqual(MIN_SEPARATION);
      last.set(id, n);
    }
  });

  it("כל ציטוט אכן חוזר — אין ציטוט שנעלם מהזרם", () => {
    const seen = new Set<number>();
    for (let n = 0; n < CYCLE_LENGTH * 2; n += 1) seen.add(excerptAt(n).id);
    expect(seen.size).toBe(CYCLE_LENGTH);
  });

  it("אין חזרה מיידית על אשכול בתפר שבין מחזורים", () => {
    for (let cycle = 1; cycle < 20; cycle += 1) {
      const last = excerptAt(cycle * CYCLE_LENGTH - 1);
      const first = excerptAt(cycle * CYCLE_LENGTH);
      expect(first.id).not.toBe(last.id);
      expect(first.cluster).not.toBe(last.cluster);
    }
  });

  it("‏`excerptAt` יציב: אותו ‎n‎ מחזיר תמיד את אותו ציטוט", () => {
    for (const n of [0, 1, 23, 24, 25, 47, 48, 200, 1001]) {
      expect(excerptAt(n).id).toBe(excerptAt(n).id);
      expect(excerptAt(n)).toBe(excerptAt(n));
    }
  });
});
