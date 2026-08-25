import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { askCompass } from "@/lib/compass/assistant/assistant";
import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";
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
  section_name: "עובדה מול סיפור",
  content: "הפרד בין מה שקרה בפועל למה שהמוח סיפר עליו.",
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

describe("askCompass — מצב שיחה", () => {
  it("תור שאינו אחרון: מחלץ שאלת-המשך, שומר ציטוט, והגוף בלי שורת-ההמשך", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "היא לא ענתה ארבע שעות, ברור שהיא לא מעוניינת",
      provider("ארבע שעות לבד עדיין לא אומרות את זה.\nשאלת המשך: יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?"),
      { conversation: { isFinalTurn: false } },
    );
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.followup).toBe("יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?");
      expect(res.answer.text).not.toContain("שאלת המשך");
      expect(res.answer.citation).toContain("פרק 4");
    }
  });

  it("תור אחרון: לעולם לא מצרף שאלת-המשך, גם אם המודל הפיק אחת", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "אז מה עכשיו",
      provider("כדאי להסתכל על הדפוס לאורך זמן.\nשאלת המשך: מה עוד קורה?"),
      { conversation: { isFinalTurn: true } },
    );
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.followup).toBeUndefined();
    }
  });

  it("שיחה: סירוב עדיין מסורב, בלי שאלת-המשך וללא ציטוט", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "שאלה כלשהי",
      provider("הספר אינו עוסק בנושא הזה.\nשאלת המשך: מה עוד?"),
      { conversation: { isFinalTurn: false } },
    );
    expect(res.answer.status).toBe("refused");
    expect(res.answer).not.toHaveProperty("followup");
    expect(res.answer).not.toHaveProperty("citation");
  });

  it("שיחה: שער-הבטיחות גובר, בלי קריאה למודל", async () => {
    const gen = vi.fn();
    const res = await askCompass(
      mockDb([row(0.6)]),
      "הוא מאיים עליי עם סכין",
      { model: "m", generate: gen as never },
      { conversation: { isFinalTurn: false } },
    );
    expect(res.answer.status).toBe("safety");
    expect(gen).not.toHaveBeenCalled();
  });

  it("שיחה: תשובה חתוכה לתקרת-המילים הקצרה (90)", async () => {
    const long = Array.from({ length: 200 }, (_, i) => `מ${i}`).join(" ");
    const res = await askCompass(mockDb([row(0.6)]), "שאלה", provider(long), {
      conversation: { isFinalTurn: false },
    });
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.text.split(/\s+/).length).toBeLessThanOrEqual(
        COMPASS_LIMITS.maxConversationAnswerWords + 1,
      );
    }
  });

  it("„מי צריך לשלם בדייט ראשון” (שיחה): מסגור מעוגן + שאלת המשך, לא סירוב גנרי", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "מי צריך לשלם בדייט ראשון",
      provider(
        "הספר לא קובע כלל שלפיו דווקא צד אחד צריך לשלם בדייט ראשון. אבל הספר כן " +
          "מזמין להסתכל על הציפיות שכל אחד מביא, ועל מה שאנחנו מפרשים מההתנהגות של " +
          "הצד השני.\nשאלת המשך: מה יותר מעסיק אותך כאן — מי משלם בפועל, או מה זה אומר אם הצד השני לא מציע?",
      ),
      { conversation: { isFinalTurn: false } },
    );
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.text).not.toContain("לא מצאתי");
      expect(res.answer.text).toContain("לא קובע");
      expect(res.answer.text).not.toMatch(/הספר\s+קובע\s+ש/);
      expect(res.answer.followup).toBeDefined();
      expect(res.answer.followup).toContain("?");
      expect(res.answer.citation).toContain("פרק 4");
    }
  });

  it("שיחה: שאלה קרובה-אך-חלשה → מסגור מעוגן (answered) עם המשך", async () => {
    const res = await askCompass(
      mockDb([row(0.55)]),
      "זה מוזר שאני עדיין חושב עליו כל הזמן?",
      provider(
        "הספר לא נותן לוח-זמנים למה „תקין”. מה שכן עולה מהקטעים הוא שמחשבות חוזרות " +
          "מספרות לרוב על משהו שלא נסגר, לא על כישלון שלך.\nשאלת המשך: מה הכי חוזר לך כשאתה חושב עליו?",
      ),
      { conversation: { isFinalTurn: false } },
    );
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.followup).toContain("?");
      expect(res.answer.text).not.toContain("לא מצאתי");
    }
  });

  it("שיחה: סימון NO_BOOK_BASIS → סירוב ספציפי, בלי שאלת-המשך וללא ציטוט", async () => {
    const specific = "זאת שאלה טכנית על מכוניות, וזה לא משהו שהספר נכנס אליו.";
    const res = await askCompass(
      mockDb([row(0.4)]),
      "כמה שמן צריך במנוע של מאזדה",
      provider(`NO_BOOK_BASIS\n${specific}`),
      { conversation: { isFinalTurn: false } },
    );
    expect(res.answer.status).toBe("refused");
    if (res.answer.status === "refused") expect(res.answer.text).toBe(specific);
    expect(res.answer).not.toHaveProperty("followup");
    expect(res.answer).not.toHaveProperty("citation");
  });

  it("שיחה עם הקשר קודם: עדיין מגיבה (עיגון האחזור על ההודעה הפותחת + הנוכחית)", async () => {
    const res = await askCompass(
      mockDb([row(0.6)]),
      "כן, גם ביטלה פעמיים",
      provider("דפוס שחוזר אומר יותר מרגע בודד.\nשאלת המשך: איך זה הרגיש בפעמים הקודמות?"),
      {
        conversation: {
          isFinalTurn: false,
          priorTurns: [
            { role: "user", text: "היא לא ענתה ארבע שעות" },
            { role: "assistant", text: "ארבע שעות לא אומרות ריחוק." },
          ],
        },
      },
    );
    expect(res.answer.status).toBe("answered");
    if (res.answer.status === "answered") {
      expect(res.answer.followup).toContain("?");
    }
  });
});
