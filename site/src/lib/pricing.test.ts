import { describe, expect, it } from "vitest";

import { calculateOrderTotals, formatPrice } from "@/lib/pricing";
import { siteConfig } from "@/config/site";

describe("calculateOrderTotals", () => {
  it("computes subtotal, shipping and total for a single copy", () => {
    const totals = calculateOrderTotals(1);
    expect(totals.quantity).toBe(1);
    expect(totals.unitPrice).toBe(siteConfig.commerce.price);
    expect(totals.subtotal).toBe(siteConfig.commerce.price);
    expect(totals.shipping).toBe(siteConfig.commerce.shippingFlatRate);
    expect(totals.total).toBe(totals.subtotal + totals.shipping);
  });

  it("multiplies subtotal by quantity", () => {
    const totals = calculateOrderTotals(3);
    expect(totals.subtotal).toBe(siteConfig.commerce.price * 3);
  });

  it("clamps quantity to a minimum of 1", () => {
    expect(calculateOrderTotals(0).quantity).toBe(1);
    expect(calculateOrderTotals(-5).quantity).toBe(1);
  });

  it("clamps quantity to a maximum of 20", () => {
    expect(calculateOrderTotals(999).quantity).toBe(20);
  });

  it("truncates non-integer quantities", () => {
    expect(calculateOrderTotals(2.9).quantity).toBe(2);
  });
});

describe("formatPrice", () => {
  it("formats whole shekel amounts without decimals", () => {
    expect(formatPrice(98)).toContain("98");
  });
});
