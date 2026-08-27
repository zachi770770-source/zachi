import { describe, it, expect } from "vitest";

import {
  readerClaimSchema,
  READER_CLAIM_CONSENT_VERSION,
} from "@/lib/validation/readerClaim";

const VALID = { email: "Dana@Example.com", consent: true };

describe("readerClaimSchema", () => {
  it("accepts email + consent and normalizes the email (trim + lowercase)", () => {
    const parsed = readerClaimSchema.parse({ ...VALID, email: "  Dana@Example.com " });
    expect(parsed.email).toBe("dana@example.com");
  });

  it("rejects when consent is not granted — never claim without opt-in", () => {
    expect(readerClaimSchema.safeParse({ ...VALID, consent: false }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(readerClaimSchema.safeParse({ ...VALID, email: "nope" }).success).toBe(false);
  });

  it("collects minimum PII — no name, no order reference, no book code", () => {
    const parsed = readerClaimSchema.parse(VALID);
    expect(parsed).not.toHaveProperty("name");
    expect(parsed).not.toHaveProperty("orderRef");
    expect(parsed).not.toHaveProperty("code");
  });

  it("allows the honeypot to be present but empty", () => {
    expect(readerClaimSchema.safeParse({ ...VALID, company: "" }).success).toBe(true);
  });

  it("keeps a stable consent version", () => {
    expect(READER_CLAIM_CONSENT_VERSION).toBe("2026-08-v1");
  });
});
