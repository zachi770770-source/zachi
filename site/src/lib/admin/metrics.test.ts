import { describe, it, expect } from "vitest";

import { ctr, AMAZON_CTR_FORMULA } from "@/lib/admin/metrics";
import { deltaPct } from "@/lib/admin/types";
import { ga4EventValue, ga4RateValue } from "@/lib/admin/select";
import type { Ga4Block, Ga4Events } from "@/lib/admin/dashboard";

describe("Amazon CTR", () => {
  it("uses sessions as the denominator (clicks ÷ sessions × 100)", () => {
    expect(ctr(50, 1000)).toEqual({ status: "ok", value: 5, previous: null });
    expect(AMAZON_CTR_FORMULA).toContain("÷ sessions");
  });
  it("is empty (never divide-by-zero, never fabricated) when there are no sessions", () => {
    expect(ctr(5, 0)).toEqual({ status: "empty" });
  });
});

describe("deltaPct", () => {
  it("computes percentage change vs previous, null when no base", () => {
    expect(deltaPct(120, 100)).toBeCloseTo(20);
    expect(deltaPct(80, 100)).toBeCloseTo(-20);
    expect(deltaPct(10, 0)).toBeNull();
    expect(deltaPct(10, null)).toBeNull();
  });
});

describe("ga4EventValue / ga4RateValue", () => {
  const okBlock: Ga4Block<Ga4Events> = {
    status: "ok",
    data: { ask_open: { count: 200, users: 150 }, ask_result: { count: 50, users: 45 } },
  };
  it("returns unsupported when GA4 is not connected", () => {
    expect(ga4EventValue({ status: "unconfigured" }, "ask_open")).toEqual({ status: "unsupported", reason: "GA4 לא מחובר" });
    expect(ga4EventValue({ status: "error" }, "ask_open").status).toBe("unsupported");
  });
  it("returns ok with the event count/users when present, empty when absent", () => {
    expect(ga4EventValue(okBlock, "ask_open")).toEqual({ status: "ok", value: 200, previous: null });
    expect(ga4EventValue(okBlock, "ask_open", "users")).toEqual({ status: "ok", value: 150, previous: null });
    expect(ga4EventValue(okBlock, "nope")).toEqual({ status: "empty" });
  });
  it("computes a rate between two events", () => {
    expect(ga4RateValue(okBlock, "ask_result", "ask_open")).toEqual({ status: "ok", value: 25, previous: null });
    expect(ga4RateValue(okBlock, "ask_result", "nope")).toEqual({ status: "empty" });
  });
});
