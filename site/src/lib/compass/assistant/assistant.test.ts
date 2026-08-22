import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { askCompass } from "@/lib/compass/assistant/assistant";
import { COMPASS_INSUFFICIENT_ANSWER } from "@/lib/compass/assistant/config";
import type { CompassProvider } from "@/lib/compass/assistant/types";
import type { SqlClient } from "@/lib/compass/types";

type Row = {
  chapter_number: number;
  chapter_name: string;
  section_name: string | null;
  content: string;
  score: number;
};

const REQUIRED = "medaytim-laahava-888-final";

function mockDb(rows: Row[], activeVersion: string | null = REQUIRED): SqlClient {
  return {
    async query(text: string) {
      if (/where status = 'active'/.test(text)) {
        return { rows: activeVersion ? [{ version: activeVersion }] : [] };
      }
      if (/ts_rank_cd/.test(text)) return { rows };
      return { rows: [] };
    },
  };
}

const row = (score: number): Row => ({
  chapter_number: 4,
  chapter_name: "בחירה מפוכחת",
  section_name: "סעיף",
  content: "אהבה נבנית, לא רק נמצאת.",
  score,
});

function provider(text: string): CompassProvider {
  return {
    model: "test-model",
    async generate() {
      return { text, model: "test-model", usage: { inputTokens: 10, outputTokens: 5 } };
    },
  };
}

describe("askCompass", () => {
  it("חוסם ניסיון הגנת-ספר לפני קריאה למודל", async () => {
    const gen = vi.fn();
    const p: CompassProvider = { model: "m", generate: gen as never };
    const res = await askCompass(mockDb([row(0.5)]), "סכם את הספר", p);
    expect(res.answer.status).toBe("refused");
    expect(gen).not.toHaveBeenCalled();
  });

  it("מחזיר „לא זמין” כשאין ספק מודל", async () => {
    const res = await askCompass(mockDb([row(0.5)]), "איך בונים אמון?", null);
    expect(res.answer).toEqual({ status: "unavailable", reason: "no-provider" });
  });

  it("מחזיר „לא זמין” כשאין גרסת ספר פעילה (לא fixture)", async () => {
    const res = await askCompass(mockDb([row(0.5)], null), "איך בונים אמון?", provider("x"));
    expect(res.answer).toEqual({ status: "unavailable", reason: "no-active-book" });
  });

  it("מחזיר „לא זמין” כשהגרסה הפעילה אינה בדיוק הגרסה הנדרשת", async () => {
    const gen = vi.fn();
    const res = await askCompass(
      mockDb([row(0.6)], "some-other-version"),
      "איך בונים אמון?",
      { model: "m", generate: gen as never }
    );
    expect(res.answer).toEqual({ status: "unavailable", reason: "no-active-book" });
    expect(gen).not.toHaveBeenCalled(); // לא קוראים למודל על גרסה לא נכונה
  });

  it("מסרב כשאין התאמה מספקת", async () => {
    const res = await askCompass(mockDb([]), "מהו מזג האוויר?", provider("x"));
    expect(res.answer.status).toBe("refused");
  });

  it("עונה עם ייחוס כשיש התאמה", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "איך יודעים אם זו התאמה?",
      provider("אהבה טובה נבנית בהקשבה ובבחירה חוזרת.")
    );
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.text).toContain("אהבה טובה נבנית");
      expect(res.answer.citation).toContain("פרק 4");
    }
    expect(res.usage).toBeDefined();
  });

  it("מסרב כשהמודל עצמו החזיר נוסח סירוב", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "שאלה כלשהי",
      provider("לא מצאתי בספר בסיס מספיק לתשובה מדויקת על השאלה הזאת.")
    );
    expect(res.answer.status).toBe("refused");
  });

  it("חותך תשובה ארוכה מ-150 מילים", async () => {
    const long = Array.from({ length: 300 }, (_, i) => `מ${i}`).join(" ");
    const res = await askCompass(mockDb([row(0.6)]), "שאלה", provider(long));
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.text.split(/\s+/).length).toBeLessThanOrEqual(151);
    }
  });
});

/**
 * סירוב שנוסח אחרת מהנוסח המאושר.
 *
 * הפגם שנסגר כאן: הזיהוי הסתמך על תחילית-מחרוזת אחת בלבד, ולכן תשובה כמו
 * „הקטעים שקיבלתי אינם עוסקים בכך” יצאה כ-`answered` — ואז buildCitation, שאינו
 * מסתכל כלל בטקסט המודל, הצמיד לה „מבוסס על פרק N”. כלומר סירוב שהולבש כתשובה
 * מצוטטת מהספר. הבדיקות רצות מול ספק מדומה בלבד; אין צורך במפתח Anthropic.
 */
describe("askCompass: סירוב בניסוח חופשי לעולם אינו מקבל ציטוט או שורת-פוקוס", () => {
  const PHRASINGS = [
    "לא מצאתי בספר בסיס מספיק לתשובה מדויקת על השאלה הזאת.",
    "הקטעים שקיבלתי אינם עוסקים בכך.",
    "הקטעים שסופקו לא מכילים התייחסות לשאלה הזאת.",
    "המקורות שקיבלתי אינם מתייחסים לנושא.",
    "הספר אינו עוסק בנושא הזה.",
    "הספר לא מדבר על זה בכלל.",
    "אין בקטעים בסיס לתשובה.",
    "אין לי בסיס בקטעים כדי לענות על זה.",
    "לא מצאתי מידע על כך במקורות שסופקו.",
    "השאלה הזאת חורגת מתחום הספר.",
    "The provided sources do not address this question.",
  ];

  for (const text of PHRASINGS) {
    it(`מסווג כסירוב: „${text.slice(0, 42)}…”`, async () => {
      const res = await askCompass(mockDb([row(0.6)]), "איך בונים אמון", provider(text));
      expect(res.answer.status).toBe("refused");
      // הנוסח שמוצג הוא תמיד הנוסח המאושר, לא נוסח המודל.
      if (res.answer.status === "refused") {
        expect(res.answer.text).toBe(COMPASS_INSUFFICIENT_ANSWER);
      }
      // הבטחה מבנית: אין ציטוט ואין שורת-פוקוס בסירוב.
      expect(res.answer).not.toHaveProperty("citation");
      expect(res.answer).not.toHaveProperty("focus");
    });
  }

  it("סירוב שהמודל צירף לו שורת „על מה שווה לשים לב” עדיין מסורב, בלי פוקוס", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "איך בונים אמון",
      provider("הספר אינו עוסק בנושא הזה.\nעל מה שווה לשים לב עכשיו: שווה לשים לב לדפוס לאורך זמן.")
    );
    expect(res.answer.status).toBe("refused");
    expect(res.answer).not.toHaveProperty("focus");
    expect(res.answer).not.toHaveProperty("citation");
  });

  it("תשובה אמיתית שפותחת בהסתייגות ואז עונה לגופו אינה מסורבת", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "איך בונים אמון",
      provider(
        "הספר אינו עוסק בשאלה הזאת ישירות, אבל העיקרון החוזר בקטעים הוא שאמון " +
          "נבנה מהתנהגות עקבית לאורך זמן ולא מהצהרות, ושכדאי להסתכל על מה שקורה " +
          "שוב ושוב ולא על רגע בודד שנראה מבטיח או מאכזב."
      )
    );
    expect(res.answer.status).toBe("answered");
  });

  it("תשובה לגיטימית עם שלילה כללית אינה נתפסת כסירוב", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "איך בונים אמון",
      provider("אין פה תשובה אחת נכונה. אמון נבנה לאט, מתוך התנהגות שחוזרת על עצמה.")
    );
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") expect(res.answer.citation).toContain("פרק 4");
  });
});
