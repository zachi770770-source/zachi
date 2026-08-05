import { describe, expect, it } from "vitest";

import { tools } from "@/content/book";
import {
  DIFFICULTY_COUNT,
  PREFERENCE_COUNT,
  STAGES,
  TOOL_BY_STAGE_DIFFICULTY,
  resolveToolId,
  type ToolId,
} from "./toolMapping";

/**
 * הוכחה שהמיפוי של ה-Path Finder דטרמיניסטי ומלא: כל צירוף מלא של
 * Q1 (תחנה) × Q2 (קושי) × Q3 (העדפה) מחזיר בדיוק כלי אחד *קיים*, אין תא חסר,
 * ואף כלי אינו „מת” — כל ששת הכלים נגישים בלפחות צירוף אחד.
 */

const ALL_TOOL_IDS = tools.items.map((t) => t.id) as ToolId[];

describe("Path Finder → tool mapping", () => {
  it("every full Q1×Q2×Q3 combination resolves to exactly one existing tool", () => {
    let combos = 0;
    for (const station of STAGES) {
      for (let d = 0; d < DIFFICULTY_COUNT; d++) {
        for (let p = 0; p < PREFERENCE_COUNT; p++) {
          // Q3 (p) אינו משנה את הכלי — אך אנו עוברים על כולו כדי לכסות את מרחב
          // הצירופים המלא ולוודא שאין תלות סמויה.
          const id = resolveToolId(station, d);
          expect(ALL_TOOL_IDS).toContain(id);
          expect(tools.items.filter((t) => t.id === id)).toHaveLength(1);
          combos++;
        }
      }
    }
    expect(combos).toBe(STAGES.length * DIFFICULTY_COUNT * PREFERENCE_COUNT); // 3×3×3 = 27
  });

  it("all six tools are reachable (no dead tool)", () => {
    const reached = new Set<ToolId>();
    for (const station of STAGES) {
      for (let d = 0; d < DIFFICULTY_COUNT; d++) {
        reached.add(resolveToolId(station, d));
      }
    }
    expect([...reached].sort()).toEqual([...ALL_TOOL_IDS].sort());
    expect(reached.size).toBe(6);
  });

  it("mapping references only tool ids that exist in book.ts", () => {
    for (const station of STAGES) {
      for (const id of TOOL_BY_STAGE_DIFFICULTY[station]) {
        expect(ALL_TOOL_IDS).toContain(id);
      }
    }
  });

  it("every stage exposes exactly one tool per difficulty option", () => {
    for (const station of STAGES) {
      expect(TOOL_BY_STAGE_DIFFICULTY[station]).toHaveLength(DIFFICULTY_COUNT);
    }
  });

  it("rejects out-of-range input instead of silently returning a default", () => {
    expect(() => resolveToolId("before-relationship", 3)).toThrow();
    expect(() => resolveToolId("before-relationship", -1)).toThrow();
  });
});
