import { describe, it, expect } from "vitest";

import {
  generateAccessToken,
  hashAccessToken,
  isValidAccessTokenShape,
} from "@/lib/reader/token";

describe("reader access token", () => {
  it("generates a 64-char lowercase hex token (256-bit)", () => {
    expect(generateAccessToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unpredictable, unique tokens", () => {
    const set = new Set(Array.from({ length: 200 }, () => generateAccessToken()));
    expect(set.size).toBe(200);
  });

  it("hashes deterministically to 64-char hex, and the hash is not the token", () => {
    const t = generateAccessToken();
    const h = hashAccessToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toBe(t);
    expect(hashAccessToken(t)).toBe(h);
    expect(hashAccessToken(generateAccessToken())).not.toBe(h);
  });

  it("validates token shape and narrows the type", () => {
    expect(isValidAccessTokenShape(generateAccessToken())).toBe(true);
    expect(isValidAccessTokenShape("")).toBe(false);
    expect(isValidAccessTokenShape(undefined)).toBe(false);
    expect(isValidAccessTokenShape(null)).toBe(false);
    expect(isValidAccessTokenShape("a".repeat(32))).toBe(false);
    expect(isValidAccessTokenShape("A".repeat(64))).toBe(false);
  });
});
