import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Math.random()}`;
    const result = checkRateLimit(key, { limit: 3, windowMs: 1000 });
    expect(result.allowed).toBe(true);
  });

  it("blocks requests once the limit is exceeded", () => {
    const key = `test-${Math.random()}`;
    checkRateLimit(key, { limit: 2, windowMs: 1000 });
    checkRateLimit(key, { limit: 2, windowMs: 1000 });
    const third = checkRateLimit(key, { limit: 2, windowMs: 1000 });

    expect(third.allowed).toBe(false);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    checkRateLimit(keyA, { limit: 1, windowMs: 1000 });

    const resultA = checkRateLimit(keyA, { limit: 1, windowMs: 1000 });
    const resultB = checkRateLimit(keyB, { limit: 1, windowMs: 1000 });

    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });
});
