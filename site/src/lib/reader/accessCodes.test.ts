import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  normalizeAccessCode,
  isReaderActivationConfigured,
  isValidAccessCode,
} from "@/lib/reader/accessCodes";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  delete process.env.READER_ACCESS_CODES;
});
afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("reader access codes", () => {
  it("normalizes case, spaces and hyphens", () => {
    expect(normalizeAccessCode("  meetings-2026 ")).toBe("MEETINGS2026");
    expect(normalizeAccessCode("MEETINGS 2026")).toBe("MEETINGS2026");
  });

  it("is not configured when no codes are set", () => {
    expect(isReaderActivationConfigured()).toBe(false);
    expect(isValidAccessCode("MEETINGS-2026")).toBe(false); // never valid without config
  });

  it("accepts a configured code regardless of formatting", () => {
    process.env.READER_ACCESS_CODES = "MEETINGS-2026, second-code";
    expect(isReaderActivationConfigured()).toBe(true);
    expect(isValidAccessCode("meetings 2026")).toBe(true);
    expect(isValidAccessCode("SECONDCODE")).toBe(true);
    expect(isValidAccessCode("wrong")).toBe(false);
  });

  it("ignores empty entries in the list", () => {
    process.env.READER_ACCESS_CODES = " , , ONLYONE , ";
    expect(isReaderActivationConfigured()).toBe(true);
    expect(isValidAccessCode("only-one")).toBe(true);
    expect(isValidAccessCode("")).toBe(false);
  });
});
