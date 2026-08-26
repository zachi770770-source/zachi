import { describe, it, expect } from "vitest";

import {
  readerClaimSchema,
  READER_CLAIM_CONSENT_VERSION,
  READER_CLAIM_SOURCES,
} from "@/lib/validation/readerClaim";

const VALID = {
  name: "דנה",
  email: "Dana@Example.com",
  orderRef: "701-1234567-1234567",
  consent: true,
  source: "reader" as const,
};

describe("readerClaimSchema", () => {
  it("accepts a valid claim and normalizes the email (trim + lowercase)", () => {
    const parsed = readerClaimSchema.parse({ ...VALID, email: "  Dana@Example.com " });
    expect(parsed.email).toBe("dana@example.com");
    expect(parsed.name).toBe("דנה");
    expect(parsed.source).toBe("reader");
  });

  it("defaults source to 'reader' when omitted", () => {
    const { source, ...rest } = VALID;
    void source;
    const parsed = readerClaimSchema.parse(rest);
    expect(parsed.source).toBe("reader");
  });

  it("rejects an order reference that is too short (proof of purchase must be present)", () => {
    const res = readerClaimSchema.safeParse({ ...VALID, orderRef: "123" });
    expect(res.success).toBe(false);
  });

  it("rejects when consent is not granted — never claim without opt-in", () => {
    const res = readerClaimSchema.safeParse({ ...VALID, consent: false });
    expect(res.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const res = readerClaimSchema.safeParse({ ...VALID, email: "not-an-email" });
    expect(res.success).toBe(false);
  });

  it("rejects an out-of-range source", () => {
    const res = readerClaimSchema.safeParse({ ...VALID, source: "twitter" });
    expect(res.success).toBe(false);
  });

  it("allows the honeypot to be present but empty", () => {
    const res = readerClaimSchema.safeParse({ ...VALID, company: "" });
    expect(res.success).toBe(true);
  });

  it("keeps a stable consent version and closed source list", () => {
    expect(READER_CLAIM_CONSENT_VERSION).toBe("2026-08-v1");
    expect([...READER_CLAIM_SOURCES]).toEqual(["reader", "book", "preview", "email"]);
  });
});
