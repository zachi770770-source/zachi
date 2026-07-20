import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/lib/validation/checkout";

const validInput = {
  fullName: "ישראל ישראלי",
  phone: "050-1234567",
  email: "test@example.com",
  city: "תל אביב",
  street: "הרצל",
  houseNumber: "10",
  apartment: "",
  zip: "",
  courierNotes: "",
  quantity: 1,
  giftDedication: "",
  agreeToTerms: true,
  marketingConsent: false,
  idempotencyKey: "abcdefghij123456",
};

describe("checkoutSchema", () => {
  it("accepts a fully valid order", () => {
    const result = checkoutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects when terms are not agreed to", () => {
    const result = checkoutSchema.safeParse({ ...validInput, agreeToTerms: false });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = checkoutSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid Israeli phone number", () => {
    const result = checkoutSchema.safeParse({ ...validInput, phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts phone numbers with and without dashes", () => {
    expect(
      checkoutSchema.safeParse({ ...validInput, phone: "0501234567" }).success
    ).toBe(true);
    expect(
      checkoutSchema.safeParse({ ...validInput, phone: "050-123-4567" }).success
    ).toBe(true);
  });

  it("rejects quantity above the maximum", () => {
    const result = checkoutSchema.safeParse({ ...validInput, quantity: 999 });
    expect(result.success).toBe(false);
  });

  it("rejects quantity below the minimum", () => {
    const result = checkoutSchema.safeParse({ ...validInput, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("requires a house number", () => {
    const result = checkoutSchema.safeParse({ ...validInput, houseNumber: "" });
    expect(result.success).toBe(false);
  });
});
