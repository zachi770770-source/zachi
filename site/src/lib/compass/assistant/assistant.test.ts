import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { askCompass } from "@/lib/compass/assistant/assistant";
import type { CompassProvider } from "@/lib/compass/assistant/types";
import type { SqlClient } from "@/lib/compass/types";

type Row = {
  chapter_number: number;
  chapter_name: string;
  section_name: string | null;
  content: string;
  score: number;
};

function mockDb(rows: Row[], activeVersion: string | null = "888"): SqlClient {
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
