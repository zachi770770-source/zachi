import { describe, it, expect } from "vitest";

import { generateAccessToken, isValidAccessTokenShape } from "@/lib/reader/token";

describe("reader access token", () => {
  it("generates a 32-char lowercase hex token (128-bit)", () => {
    const t = generateAccessToken();
    expect(t).toMatch(/^[0-9a-f]{32}$/);
  });

  it("generates unpredictable, unique tokens", () => {
    const set = new Set(Array.from({ length: 200 }, () => generateAccessToken()));
    expect(set.size).toBe(200);
  });

  it("validates token shape and narrows the type", () => {
    expect(isValidAccessTokenShape(generateAccessToken())).toBe(true);
    expect(isValidAccessTokenShape("")).toBe(false);
    expect(isValidAccessTokenShape(undefined)).toBe(false);
    expect(isValidAccessTokenShape(null)).toBe(false);
    expect(isValidAccessTokenShape("XYZ")).toBe(false);
    expect(isValidAccessTokenShape("A".repeat(32))).toBe(false); // uppercase rejected
    expect(isValidAccessTokenShape("a".repeat(31))).toBe(false); // wrong length
  });
});
