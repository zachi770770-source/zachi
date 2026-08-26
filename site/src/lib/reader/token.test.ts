import { describe, it, expect } from "vitest";

import {
  generateSessionToken,
  hashSessionToken,
  isValidSessionTokenShape,
} from "@/lib/reader/token";

describe("reader session token", () => {
  it("generates a 64-char lowercase hex token (256-bit)", () => {
    expect(generateSessionToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unpredictable, unique tokens", () => {
    const set = new Set(Array.from({ length: 200 }, () => generateSessionToken()));
    expect(set.size).toBe(200);
  });

  it("hashes deterministically to 64-char hex, and the hash is not the token", () => {
    const t = generateSessionToken();
    const h = hashSessionToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toBe(t);
    expect(hashSessionToken(t)).toBe(h); // stable
    expect(hashSessionToken(generateSessionToken())).not.toBe(h);
  });

  it("validates token shape and narrows the type", () => {
    expect(isValidSessionTokenShape(generateSessionToken())).toBe(true);
    expect(isValidSessionTokenShape("")).toBe(false);
    expect(isValidSessionTokenShape(undefined)).toBe(false);
    expect(isValidSessionTokenShape(null)).toBe(false);
    expect(isValidSessionTokenShape("a".repeat(32))).toBe(false); // too short
    expect(isValidSessionTokenShape("A".repeat(64))).toBe(false); // uppercase rejected
  });
});
