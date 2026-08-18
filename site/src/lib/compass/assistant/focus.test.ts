import { describe, it, expect } from "vitest";

import {
  extractFocus,
  FOCUS_LABEL,
  COMPASS_SYSTEM_PROMPT,
} from "@/lib/compass/assistant/prompt";

/**
 * חילוץ שורת „על מה שווה לשים לב עכשיו” מפלט המודל, והנחיות המערכת סביבה.
 * עיקרון: השורה נגזרת מהתשובה עצמה (אותם קטעים), נחלצת דטרמיניסטית, ולעולם
 * אינה מומצאת בצד הלקוח.
 */

describe("extractFocus", () => {
  it("splits a trailing labeled line into body + focus", () => {
    const raw = `זו התשובה מהספר על המצב.\n${FOCUS_LABEL}: פחות סימן בודד, ויותר דפוס לאורך זמן.`;
    const { body, focus } = extractFocus(raw);
    expect(body).toBe("זו התשובה מהספר על המצב.");
    expect(focus).toBe("פחות סימן בודד, ויותר דפוס לאורך זמן.");
  });

  it("returns no focus when the label is absent (never fabricates one)", () => {
    const raw = "תשובה רגילה בלי שורת תשומת-לב.";
    const { body, focus } = extractFocus(raw);
    expect(body).toBe(raw);
    expect(focus).toBeUndefined();
  });

  it("takes a single line only and caps very long focus text", () => {
    const long = Array.from({ length: 40 }, (_, i) => `מ${i}`).join(" ");
    const { focus } = extractFocus(`גוף.\n${FOCUS_LABEL}: ${long}\nשורה נוספת שתיזרק`);
    expect(focus).toBeDefined();
    expect(focus!.split(/\s+/).length).toBeLessThanOrEqual(30);
    expect(focus!).not.toContain("שורה נוספת");
  });

  it("drops an empty or refusal-shaped focus, keeping the body", () => {
    const empty = extractFocus(`גוף התשובה.\n${FOCUS_LABEL}:   `);
    expect(empty.focus).toBeUndefined();
    expect(empty.body).toBe("גוף התשובה.");

    const refusal = extractFocus(
      `גוף התשובה.\n${FOCUS_LABEL}: לא מצאתי בספר בסיס מספיק לתשובה מדויקת.`,
    );
    expect(refusal.focus).toBeUndefined();
  });

  it("handles empty input", () => {
    expect(extractFocus("")).toEqual({ body: "" });
  });
});

describe("system prompt, attention-line instructions", () => {
  it("names the exact label and keeps it as an optional final line", () => {
    expect(COMPASS_SYSTEM_PROMPT).toContain(FOCUS_LABEL);
    expect(COMPASS_SYSTEM_PROMPT).toContain("אופציונלית");
  });

  it("instructs grounding-only and one short sentence", () => {
    expect(COMPASS_SYSTEM_PROMPT).toContain("מבוסס אך ורק על הקטעים");
    expect(COMPASS_SYSTEM_PROMPT).toContain("משפט אחד");
  });

  it("instructs to omit the line in safety-critical situations", () => {
    // סכנה / פגיעה עצמית / משבר → בלי שורת „שווה לשים לב”.
    expect(COMPASS_SYSTEM_PROMPT).toMatch(/סכנה|פגיעה עצמית|משבר/);
    expect(COMPASS_SYSTEM_PROMPT).toContain("בלי שום שורת");
  });

  it("discourages surveillance/hypervigilance framing", () => {
    expect(COMPASS_SYSTEM_PROMPT).toMatch(/להרחיב מבט|להפחית ניתוח-יתר/);
  });
});
