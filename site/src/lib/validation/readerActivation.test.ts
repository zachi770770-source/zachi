import { describe, it, expect } from "vitest";

import {
  readerActivationSchema,
  READER_ACTIVATION_CONSENT_VERSION,
} from "@/lib/validation/readerActivation";

const VALID = {
  email: "Dana@Example.com",
  code: "MEETINGS-2026",
  consent: true,
};

describe("readerActivationSchema", () => {
  it("accepts a valid activation and normalizes the email (trim + lowercase)", () => {
    const parsed = readerActivationSchema.parse({ ...VALID, email: "  Dana@Example.com " });
    expect(parsed.email).toBe("dana@example.com");
    expect(parsed.code).toBe("MEETINGS-2026");
  });

  it("requires an activation code (proof-of-possession, not an order id)", () => {
    const res = readerActivationSchema.safeParse({ ...VALID, code: "" });
    expect(res.success).toBe(false);
  });

  it("rejects a too-short code", () => {
    const res = readerActivationSchema.safeParse({ ...VALID, code: "ab" });
    expect(res.success).toBe(false);
  });

  it("rejects when consent is not granted — never activate without opt-in", () => {
    const res = readerActivationSchema.safeParse({ ...VALID, consent: false });
    expect(res.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const res = readerActivationSchema.safeParse({ ...VALID, email: "not-an-email" });
    expect(res.success).toBe(false);
  });

  it("does not collect name or order reference (minimal PII)", () => {
    const parsed = readerActivationSchema.parse(VALID);
    expect(parsed).not.toHaveProperty("name");
    expect(parsed).not.toHaveProperty("orderRef");
  });

  it("allows the honeypot to be present but empty", () => {
    const res = readerActivationSchema.safeParse({ ...VALID, company: "" });
    expect(res.success).toBe(true);
  });

  it("keeps a stable consent version", () => {
    expect(READER_ACTIVATION_CONSENT_VERSION).toBe("2026-08-v1");
  });
});
