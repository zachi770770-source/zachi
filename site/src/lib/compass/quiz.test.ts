import { describe, expect, it } from "vitest";

import {
  COMPASS_QUESTIONS,
  COMPASS_QUESTION_COUNT,
  COMPASS_STATION_ORDER,
  answerLabel,
  resolveCompass,
  type CompassStationId,
} from "./quiz";

/**
 * מיפוי „המצפן” — דטרמיניסטי, ממצה, מכסה שוויון ושני-גורמים.
 */

function idxOfStation(qIndex: number, station: CompassStationId): number {
  return COMPASS_QUESTIONS[qIndex].options.findIndex((o) => o.station === station);
}

describe("compass quiz mapping", () => {
  it("has three questions, three station-distinct options each", () => {
    expect(COMPASS_QUESTION_COUNT).toBe(3);
    for (const q of COMPASS_QUESTIONS) {
      expect(q.options).toHaveLength(3);
      const stations = q.options.map((o) => o.station).sort();
      expect(stations).toEqual([...COMPASS_STATION_ORDER].sort());
    }
  });

  it("every one of the 27 combinations resolves to a valid station + exactly two factors", () => {
    let combos = 0;
    const reached = new Set<CompassStationId>();
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++)
        for (let c = 0; c < 3; c++) {
          const r = resolveCompass([a, b, c]);
          expect(COMPASS_STATION_ORDER).toContain(r.station);
          expect(r.factorIndices).toHaveLength(2);
          // אינדקסי הגורמים חוקיים וייחודיים
          expect(new Set(r.factorIndices).size).toBe(2);
          r.factorIndices.forEach((i) => expect(i).toBeGreaterThanOrEqual(0));
          r.factorIndices.forEach((i) => expect(i).toBeLessThan(3));
          reached.add(r.station);
          combos++;
        }
    expect(combos).toBe(27);
    // כל שלוש התחנות נגישות
    expect([...reached].sort()).toEqual([...COMPASS_STATION_ORDER].sort());
  });

  it("unanimous answers → that station, no tie, both factors point to it", () => {
    for (const station of COMPASS_STATION_ORDER) {
      const answers = [0, 1, 2].map((q) => idxOfStation(q, station));
      const r = resolveCompass(answers);
      expect(r.station).toBe(station);
      expect(r.tie).toBe(false);
      r.factorIndices.forEach((i) => {
        expect(COMPASS_QUESTIONS[i].options[answers[i]].station).toBe(station);
      });
    }
  });

  it("2-of-3 majority wins without a tie", () => {
    // Q0+Q1 → starting-again, Q2 → inside; majority starting-again.
    const answers = [
      idxOfStation(0, "starting-again"),
      idxOfStation(1, "starting-again"),
      idxOfStation(2, "inside-relationship"),
    ];
    const r = resolveCompass(answers);
    expect(r.station).toBe("starting-again");
    expect(r.tie).toBe(false);
    // שני הגורמים הם שתי השאלות שהצביעו על התחנה המנצחת
    expect(r.factorIndices.sort()).toEqual([0, 1]);
  });

  it("three different picks → 1-1-1 tie, broken deterministically by station order", () => {
    const answers = [
      idxOfStation(0, "inside-relationship"),
      idxOfStation(1, "starting-again"),
      idxOfStation(2, "before-relationship"),
    ];
    const r = resolveCompass(answers);
    expect(r.tie).toBe(true);
    // שובר-השוויון: הראשון בסדר הקבוע מבין השווים = before-relationship
    expect(r.station).toBe("before-relationship");
    expect(r.factorIndices).toHaveLength(2);
    // הגורם הראשון הוא השאלה שהצביעה על התחנה המנצחת (Q2), ואז השלמה בסדר
    expect(r.factorIndices[0]).toBe(2);
  });

  it("tie order is stable regardless of answer order", () => {
    const a = resolveCompass([
      idxOfStation(0, "inside-relationship"),
      idxOfStation(1, "before-relationship"),
      idxOfStation(2, "starting-again"),
    ]);
    expect(a.station).toBe("before-relationship"); // first in order among the tie
    expect(a.tie).toBe(true);
  });

  it("rejects malformed input instead of guessing", () => {
    expect(() => resolveCompass([0, 1])).toThrow();
    expect(() => resolveCompass([0, 1, 3])).toThrow();
    expect(() => resolveCompass([0, -1, 2])).toThrow();
    // @ts-expect-error intentional wrong type
    expect(() => resolveCompass("nope")).toThrow();
  });

  it("answerLabel returns the chosen option text", () => {
    expect(answerLabel(0, 0)).toBe(COMPASS_QUESTIONS[0].options[0].label);
    expect(answerLabel(9, 9)).toBe("");
  });
});
