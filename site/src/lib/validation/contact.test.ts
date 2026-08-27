import { describe, expect, it } from "vitest";

import { contactSchema } from "@/lib/validation/contact";

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
