import { describe, it, expect } from "vitest";

import { resolveRange, daysInRange } from "@/lib/admin/range";

const NOW = new Date("2026-08-27T10:00:00.000Z");

describe("resolveRange", () => {
  it("defaults to 7 days with an equal-length previous window", () => {
    const r = resolveRange(undefined, { now: NOW });
    expect(r.key).toBe("7d");
    expect(r.current.to).toEqual(NOW);
    expect((r.current.to.getTime() - r.current.from.getTime()) / 86400000).toBe(7);
    // previous window is the 7 days immediately before current
    expect(r.previous.to).toEqual(r.current.from);
    expect((r.previous.to.getTime() - r.previous.from.getTime()) / 86400000).toBe(7);
  });

  it("supports 30d and today", () => {
    expect(resolveRange("30d", { now: NOW }).key).toBe("30d");
    const today = resolveRange("today", { now: NOW });
    expect(today.key).toBe("today");
    expect(today.current.from.toISOString()).toBe("2026-08-27T00:00:00.000Z");
  });

  it("accepts a valid custom range and derives the previous window by span", () => {
    const r = resolveRange("custom", { from: "2026-08-01", to: "2026-08-11", now: NOW });
    expect(r.key).toBe("custom");
    const span = r.current.to.getTime() - r.current.from.getTime();
    expect(span / 86400000).toBe(10);
    expect(r.previous.to).toEqual(r.current.from);
    expect(r.previous.from.getTime()).toBe(r.current.from.getTime() - span);
  });

  it("falls back to 7d when custom bounds are invalid", () => {
    expect(resolveRange("custom", { from: "bad", to: "also-bad", now: NOW }).key).toBe("7d");
    expect(resolveRange("custom", { from: "2026-08-11", to: "2026-08-01", now: NOW }).key).toBe("7d");
  });

  it("daysInRange lists inclusive UTC days", () => {
    const days = daysInRange({ from: new Date("2026-08-25T05:00:00Z"), to: new Date("2026-08-27T09:00:00Z") });
    expect(days).toEqual(["2026-08-25", "2026-08-26", "2026-08-27"]);
  });
});
