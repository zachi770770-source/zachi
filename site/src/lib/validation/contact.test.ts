import { describe, expect, it } from "vitest";

import { contactSchema } from "@/lib/validation/contact";
import { newsletterSchema } from "@/lib/validation/newsletter";

describe("contactSchema", () => {
  const base = {
    name: "דנה",
    contact: "dana@example.com",
    subject: "שאלה על ההזמנה",
    message: "שלום, מתי הספר יגיע בערך?",
  };

  it("accepts a valid message", () => {
    expect(contactSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a filled honeypot field", () => {
    const result = contactSchema.safeParse({ ...base, website: "http://spam.example" });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short message", () => {
    const result = contactSchema.safeParse({ ...base, message: "היי" });
    expect(result.success).toBe(false);
  });
});

describe("newsletterSchema", () => {
  const base = {
    firstName: "נועה",
    email: "noa@example.com",
    contentConsent: true,
    marketingConsent: false,
  };

  it("accepts when content consent is given", () => {
    expect(newsletterSchema.safeParse(base).success).toBe(true);
  });

  it("rejects when content consent is missing", () => {
    const result = newsletterSchema.safeParse({ ...base, contentConsent: false });
    expect(result.success).toBe(false);
  });

  it("does not require marketing consent", () => {
    expect(
      newsletterSchema.safeParse({ ...base, marketingConsent: false }).success
    ).toBe(true);
  });
});
