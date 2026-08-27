import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  isAdminConfigured,
  verifyAdminPassword,
  issueSessionToken,
  verifySessionToken,
} from "@/lib/admin/auth";

const ORIGINAL = { ...process.env };
beforeEach(() => {
  process.env.READER_ADMIN_TOKEN = "s3cret-admin-token";
});
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("admin auth", () => {
  it("is unconfigured without the secret (no login possible)", () => {
    delete process.env.READER_ADMIN_TOKEN;
    expect(isAdminConfigured()).toBe(false);
    expect(verifyAdminPassword("anything")).toBe(false);
    expect(issueSessionToken()).toBeNull();
    expect(verifySessionToken("whatever")).toBe(false);
  });

  it("verifies the admin password (timing-safe, exact match)", () => {
    expect(verifyAdminPassword("s3cret-admin-token")).toBe(true);
    expect(verifyAdminPassword("wrong")).toBe(false);
    expect(verifyAdminPassword("s3cret-admin-toke")).toBe(false);
  });

  it("issues a session token that verifies, and rejects tampering", () => {
    const token = issueSessionToken()!;
    expect(verifySessionToken(token)).toBe(true);
    // tamper the signature
    expect(verifySessionToken(token.slice(0, -2) + "00")).toBe(false);
    // wrong shape
    expect(verifySessionToken("a.b.c")).toBe(false);
    expect(verifySessionToken(undefined)).toBe(false);
  });

  it("rejects an expired session token", () => {
    const past = Date.now() - 1000;
    // issue with a 'now' far in the past so exp is already behind
    const token = issueSessionToken(past - 1000 * 60 * 60 * 13)!;
    expect(verifySessionToken(token)).toBe(false);
  });

  it("a token signed under a different secret does not verify", () => {
    const token = issueSessionToken()!;
    process.env.READER_ADMIN_TOKEN = "a-different-secret-value";
    expect(verifySessionToken(token)).toBe(false);
  });
});
