import { describe, it, expect } from "vitest";

import {
  readerKitGroups,
  readerSeriesDays,
  readerKitOffer,
} from "@/content/readerKit";

/** שמות-כלים שהומצאו ואינם במקור (ראו src/content/methods.ts) — אסור שיופיעו. */
const FORBIDDEN_NAMES = [
  "מפת הערכים",
  "שאלת הדגלים",
  "הסכם ההתחלה",
  "הסכמה רגשית",
];

const allResources = readerKitGroups.flatMap((g) => g.resources);

function allText(): string {
  return JSON.stringify({ readerKitGroups, readerSeriesDays, readerKitOffer });
}

describe("reader kit content integrity", () => {
  it("never uses an invented tool name", () => {
    const blob = allText();
    for (const name of FORBIDDEN_NAMES) {
      expect(blob).not.toContain(name);
    }
  });

  it("every resource points to a real internal route (/method, /guide, or /reader)", () => {
    for (const r of allResources) {
      expect(r.href).toMatch(/^\/(method|guide|reader)(\/|#|$)/);
    }
  });

  it("has stable, unique resource ids for analytics", () => {
    const ids = allResources.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("organizes the kit by need, not as a flat file list", () => {
    expect(readerKitGroups.length).toBeGreaterThanOrEqual(3);
    for (const g of readerKitGroups) {
      expect(g.need.length).toBeGreaterThan(0);
      expect(g.resources.length).toBeGreaterThan(0);
    }
  });

  it("the 7-day series is exactly Day 1–7, each tied to a real tool + one small action", () => {
    expect(readerSeriesDays.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const d of readerSeriesDays) {
      expect(d.href).toMatch(/^\/(method|guide|reader)(\/|#|$)/);
      expect(d.idea.trim().length).toBeGreaterThan(0);
      expect(d.action.trim().length).toBeGreaterThan(0);
    }
  });

  it("states the offer is included at no extra cost (value framing, not a trick)", () => {
    expect(readerKitOffer.includedLine).toContain("ללא תשלום נוסף");
    expect(readerKitOffer.ctaSubline).toContain("ללא תשלום נוסף");
  });
});
