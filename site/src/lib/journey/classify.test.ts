import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { classifyCurrentSituation } from "@/lib/journey/classify";
import { JOURNEY_IDS, JOURNEYS, journeyTool } from "@/content/journeys";
import { PERSONA_IDS } from "@/content/personas";

/**
 * הסיווג של „המצב הנוכחי" (Journey). דטרמיניסטי, מבוסס אך ורק על מה שהמבקר כתב.
 * חמשת מקרי-הקבלה שהוגדרו + הבטחת ההפרדה המוחלטת מ-Persona.
 */

describe("classifyCurrentSituation — חמשת מקרי הקבלה", () => {
  const cases: Array<[string, string]> = [
    ["היא לא ענתה לי ארבע שעות. זה אומר שהיא לא מעוניינת?", "interpreting-signals"],
    ["אני תמיד נמשך לאנשים שלא באמת פנויים אליי", "recurring-pattern"],
    ["אני לא יודע אם להמשיך איתה", "deciding-continue"],
    ["אנחנו רבים שוב על אותו הדבר", "conflict-distance"],
    ["אני מתגעגע אליה אבל יודע שהקשר לא היה טוב", "ending-letting-go"],
  ];

  it.each(cases)("‏%s → %s", (input, expected) => {
    expect(classifyCurrentSituation(input)).toBe(expected);
  });
});

describe("classifyCurrentSituation — עמימות ואי-כפייה", () => {
  it("קלט עמום/ניטרלי → null (גשר גנרי, בלי לכפות סיווג)", () => {
    expect(classifyCurrentSituation("היי, מה קורה?")).toBeNull();
    expect(classifyCurrentSituation("רq")).toBeNull();
    expect(classifyCurrentSituation("אני קצת עייף היום")).toBeNull();
  });

  it("אות בודד וחלש אינו מספיק להכרעה", () => {
    // „תמיד" לבדו (weak) בלי אות חזק → מתחת לסף.
    expect(classifyCurrentSituation("אני תמיד שמח בבוקר")).toBeNull();
  });

  it("תור-המשך קצר עדיין מסווג לפי ההודעה הפותחת (עיגון)", () => {
    const result = classifyCurrentSituation("כן, גם ביטלה פעמיים", {
      firstUserText: "היא לא ענתה לי ארבע שעות, זה אומר שלא מעוניינת?",
    });
    expect(result).toBe("interpreting-signals");
  });
});

describe("הפרדה מוחלטת בין Journey ל-Persona (מחייב)", () => {
  it("מזהי המסעות והפרסונות זרים לחלוטין", () => {
    for (const j of JOURNEY_IDS) {
      expect(PERSONA_IDS as readonly string[]).not.toContain(j);
    }
    for (const p of PERSONA_IDS) {
      expect(JOURNEY_IDS as readonly string[]).not.toContain(p);
    }
  });

  it("הסיווג מחזיר רק JourneyId או null — לעולם לא Persona", () => {
    const inputs = [
      "היא לא ענתה לי ארבע שעות. זה אומר שהיא לא מעוניינת?",
      "אני תמיד נמשך לאנשים שלא פנויים",
      "טקסט אקראי לגמרי בלי אותות",
      "אני רווק כבר הרבה זמן", // מזכיר „רווק" (פרסונה) — אסור שיסווג כפרסונה
    ];
    for (const input of inputs) {
      const r = classifyCurrentSituation(input);
      expect(r === null || (JOURNEY_IDS as readonly string[]).includes(r)).toBe(true);
      expect(PERSONA_IDS as readonly string[]).not.toContain(r as string);
    }
  });

  it("שכבת הסיווג/המסעות אינה מייבאת את personas (הפרדה מבנית)", () => {
    const classifySrc = readFileSync(
      resolve(process.cwd(), "src/lib/journey/classify.ts"),
      "utf8",
    );
    const journeysSrc = readFileSync(
      resolve(process.cwd(), "src/content/journeys.ts"),
      "utf8",
    );
    // ההבטחה המהותית: אין ייבוא/תלות ב-personas (המילה עשויה להופיע בהערה
    // שמסבירה דווקא את ההפרדה — ולכן בודקים את נתיב-הייבוא, לא אזכור בטקסט).
    expect(classifySrc).not.toContain('from "@/content/personas"');
    expect(journeysSrc).not.toContain('from "@/content/personas"');
    expect(classifySrc).not.toContain("PersonaProvider");
  });
});

describe("journeyTool — כל מסע ממופה לכלי /method/* אמיתי", () => {
  it("לכל מסע יש כלי קיים עם נתיב /method/<slug> ותווית", () => {
    for (const id of JOURNEY_IDS) {
      const tool = journeyTool(id);
      expect(tool, `journey ${id} tool`).toBeDefined();
      expect(tool!.path).toBe(`/method/${tool!.slug}`);
      expect(tool!.term.length).toBeGreaterThan(0);
      expect(JOURNEYS[id].bridge.length).toBeGreaterThan(0);
      expect(JOURNEYS[id].toolLinkLabel.length).toBeGreaterThan(0);
    }
  });
});
