import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import type { Order } from "@/lib/orders/types";

/**
 * חוזה הניווט של /thank-you (עמוד אחרי-תשלום):
 *  - ה-URL התקין הוא /thank-you?order=<order.id> (נקבע ב-api/checkout
 *    כ-returnUrl, וב-checkout/pay/[sessionId] כ-router.push).
 *  - העמוד שולף את ההזמנה מהמאגר בצד השרת ואינו סומך על שום דגל-הצלחה
 *    מה-URL; ללא ?order או עם מזהה לא-קיים → notFound() (404 מכוון).
 *
 * כאן מוכיחים את התרחיש התקין (הזמנה משולמת → אישור) ואת שלושת מצבי
 * ה-404/מצב-תשלום, ברמת רכיב-השרת עצמו (getOrderRepository ממוקה).
 */

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const getById = vi.fn();
vi.mock("@/lib/orders", () => ({
  getOrderRepository: () => ({ getById }),
}));

// נטען אחרי ה-mocks.
const { default: ThankYouPage } = await import("@/app/thank-you/page");

function paidOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ORDER123",
    orderNumber: "MLA-1042",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    customerName: "ישראל ישראלי",
    email: "buyer@example.com",
    format: "digital",
    items: [{ title: "מדייטים לאהבה", quantity: 1, unitPrice: 98 }],
    subtotal: 98,
    discount: 0,
    shipping: 0,
    total: 98,
    currency: "ILS",
    paymentStatus: "paid",
    fulfillmentStatus: "access_granted",
    paymentProvider: "mock",
    providerTransactionId: "txn_1",
    idempotencyKey: "key-1",
    marketingConsent: false,
    ...overrides,
  };
}

beforeEach(() => getById.mockReset());
afterEach(cleanup);

describe("/thank-you navigation contract", () => {
  it("renders the paid confirmation for /thank-you?order=<validPaidId>", async () => {
    getById.mockResolvedValue(paidOrder());
    const ui = await ThankYouPage({
      searchParams: Promise.resolve({ order: "ORDER123" }),
    });
    render(ui);
    expect(getById).toHaveBeenCalledWith("ORDER123");
    expect(
      screen.getByRole("heading", { level: 1 })
    ).toHaveTextContent("תודה! ההזמנה התקבלה בהצלחה");
    expect(screen.getByText(/MLA-1042/)).toBeInTheDocument();
  });

  it("404s (notFound) when no ?order param is present", async () => {
    await expect(
      ThankYouPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getById).not.toHaveBeenCalled();
  });

  it("404s (notFound) for an unknown order id", async () => {
    getById.mockResolvedValue(null);
    await expect(
      ThankYouPage({ searchParams: Promise.resolve({ order: "BOGUS" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getById).toHaveBeenCalledWith("BOGUS");
  });

  it("shows a pending state (not 404) for an unpaid but real order", async () => {
    getById.mockResolvedValue(paidOrder({ paymentStatus: "pending" }));
    const ui = await ThankYouPage({
      searchParams: Promise.resolve({ order: "ORDER123" }),
    });
    render(ui);
    expect(
      screen.getByRole("heading", { level: 1 })
    ).toHaveTextContent("התשלום עדיין בעיבוד");
  });
});
