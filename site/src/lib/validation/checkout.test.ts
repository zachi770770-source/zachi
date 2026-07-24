import { describe, expect, it } from "vitest";

import { checkoutSchema } from "@/lib/validation/checkout";

/** הזמנה דיגיטלית תקינה - אינה דורשת פרטי משלוח. */
const validDigital = {
  format: "digital",
  fullName: "ישראל ישראלי",
  email: "test@example.com",
  quantity: 1,
  giftDedication: "",
  agreeToTerms: true,
  marketingConsent: false,
  idempotencyKey: "abcdefghij123456",
};

/** הזמנה של מהדורה מודפסת - דורשת פרטי משלוח. */
const validPhysical = {
  ...validDigital,
  format: "physical",
  phone: "050-1234567",
  city: "תל אביב",
  street: "הרצל",
  houseNumber: "10",
  apartment: "",
  zip: "",
  courierNotes: "",
};

describe("checkoutSchema", () => {
  it("accepts a valid digital order without shipping details", () => {
    const result = checkoutSchema.safeParse(validDigital);
    expect(result.success).toBe(true);
  });

  it("accepts a valid physical order with shipping details", () => {
    const result = checkoutSchema.safeParse(validPhysical);
    expect(result.success).toBe(true);
  });

  it("rejects an unknown format", () => {
    const result = checkoutSchema.safeParse({ ...validDigital, format: "audio" });
    expect(result.success).toBe(false);
  });

  it("rejects when terms are not agreed to", () => {
    const result = checkoutSchema.safeParse({ ...validDigital, agreeToTerms: false });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = checkoutSchema.safeParse({ ...validDigital, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid Israeli phone number on a physical order", () => {
    const result = checkoutSchema.safeParse({ ...validPhysical, phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts physical phone numbers with and without dashes", () => {
    expect(
      checkoutSchema.safeParse({ ...validPhysical, phone: "0501234567" }).success
    ).toBe(true);
    expect(
      checkoutSchema.safeParse({ ...validPhysical, phone: "050-123-4567" }).success
    ).toBe(true);
  });

  it("rejects quantity above the maximum", () => {
    const result = checkoutSchema.safeParse({ ...validDigital, quantity: 999 });
    expect(result.success).toBe(false);
  });

  it("rejects quantity below the minimum", () => {
    const result = checkoutSchema.safeParse({ ...validDigital, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("requires a house number on a physical order", () => {
    const result = checkoutSchema.safeParse({ ...validPhysical, houseNumber: "" });
    expect(result.success).toBe(false);
  });

  it("does not require address fields on a digital order", () => {
    const result = checkoutSchema.safeParse({
      ...validDigital,
      city: "",
      street: "",
      houseNumber: "",
      phone: "",
    });
    expect(result.success).toBe(true);
  });
});
