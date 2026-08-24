import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  COMPASS_CONVERSATION_SYSTEM_PROMPT,
  FOLLOWUP_LABEL,
  buildConversationContent,
  extractFollowup,
} from "@/lib/compass/assistant/prompt";
import type { CompassMatch } from "@/lib/compass/types";

const match: CompassMatch = {
  chapterNumber: 4,
  chapterName: "בחירה מפוכחת",
  sectionName: "עובדה מול סיפור",
  content: "הפרד בין מה שקרה בפועל למה שהמוח סיפר עליו.",
  score: 0.6,
};

describe("extractFollowup", () => {
  it("מפריד גוף משאלת-המשך תקינה (מסתיימת בסימן שאלה)", () => {
    const { body, followup } = extractFollowup(
      "ארבע שעות לבד לא בהכרח אומרות ריחוק.\nשאלת המשך: יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?",
    );
    expect(body).toBe("ארבע שעות לבד לא בהכרח אומרות ריחוק.");
    expect(followup).toBe("יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?");
  });

  it("ללא תווית → הכול גוף, אין שאלת-המשך", () => {
    const { body, followup } = extractFollowup("כיוון קצר מהספר בלי שאלה.");
    expect(body).toBe("כיוון קצר מהספר בלי שאלה.");
    expect(followup).toBeUndefined();
  });

  it("שורה שאינה שאלה (בלי „?”) אינה נחשבת שאלת-המשך", () => {
    const { body, followup } = extractFollowup("גוף.\nשאלת המשך: תחשבו על זה בשקט.");
    expect(followup).toBeUndefined();
    expect(body).toContain("גוף.");
  });

  it("נוסח-סירוב בשורת-ההמשך נדחה", () => {
    const { followup } = extractFollowup(
      "גוף.\nשאלת המשך: לא מצאתי בספר בסיס מספיק לתשובה?",
    );
    expect(followup).toBeUndefined();
  });

  it("מגביל את שאלת-ההמשך ל-30 מילים", () => {
    // „?” בתוך 30 המילים הראשונות, כדי שהחיתוך לא יסיר אותו.
    const longQ = "מה קרה כאן בעצם? " + Array.from({ length: 40 }, (_, i) => `מ${i}`).join(" ");
    const { followup } = extractFollowup(`גוף.\nשאלת המשך: ${longQ}`);
    expect(followup).toBeDefined();
    expect(followup!.split(/\s+/).length).toBeLessThanOrEqual(30);
  });
});

describe("buildConversationContent", () => {
  it("כולל את הקטעים הממוספרים ואת ההודעה הנוכחית", () => {
    const out = buildConversationContent({
      question: "היא לא ענתה ארבע שעות",
      matches: [match],
      isFinalTurn: false,
    });
    expect(out).toContain("מקור 1");
    expect(out).toContain("עובדה מול סיפור");
    expect(out).toContain("היא לא ענתה ארבע שעות");
    expect(out).toContain("סיים בשאלת המשך");
  });

  it("כולל את התורות הקודמים כהקשר בלבד", () => {
    const out = buildConversationContent({
      question: "כן, גם ביטלה פעמיים",
      matches: [match],
      priorTurns: [
        { role: "user", text: "היא לא ענתה ארבע שעות" },
        { role: "assistant", text: "ארבע שעות לא אומרות ריחוק." },
      ],
      isFinalTurn: false,
    });
    expect(out).toContain("המבקר: היא לא ענתה ארבע שעות");
    expect(out).toContain("אתה: ארבע שעות לא אומרות ריחוק.");
  });

  it("בתור האחרון מסמן סגירה בלי שאלת-המשך", () => {
    const out = buildConversationContent({
      question: "מה עכשיו",
      matches: [match],
      isFinalTurn: true,
    });
    expect(out).toContain("התור האחרון");
    expect(out).toContain("בלי שאלת המשך");
  });
});

describe("COMPASS_CONVERSATION_SYSTEM_PROMPT", () => {
  it("שומר על מקור-סגור, על ההבחנה עובדה/סיפור ועל תווית שאלת-ההמשך", () => {
    expect(COMPASS_CONVERSATION_SYSTEM_PROMPT).toContain("מקור סגור");
    expect(COMPASS_CONVERSATION_SYSTEM_PROMPT).toContain("מה שקרה בפועל");
    expect(COMPASS_CONVERSATION_SYSTEM_PROMPT).toContain(FOLLOWUP_LABEL);
    expect(COMPASS_CONVERSATION_SYSTEM_PROMPT).toContain("אל תסכים אוטומטית");
  });
});
