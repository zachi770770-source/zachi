import { describe, expect, it } from "vitest";

import { InMemoryOrderRepository } from "@/lib/orders/inMemoryRepository";
import type { CreateOrderInput } from "@/lib/orders/types";

function makeInput(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
    customerName: "ישראל ישראלי",
    phone: "0501234567",
    email: "test@example.com",
    shippingAddress: { city: "תל אביב", street: "הרצל", houseNumber: "10" },
    items: [{ title: "מדייטים לאהבה", quantity: 1, unitPrice: 98 }],
    subtotal: 98,
    shipping: 25,
    discount: 0,
    total: 123,
    currency: "ILS",
    paymentProvider: "mock",
    idempotencyKey: "key-1",
    marketingConsent: false,
    ...overrides,
  };
}

describe("InMemoryOrderRepository", () => {
  it("creates an order with a generated id and order number", async () => {
    const repo = new InMemoryOrderRepository();
    const order = await repo.create(makeInput());

    expect(order.id).toBeTruthy();
    expect(order.orderNumber).toMatch(/^MLA-/);
    expect(order.paymentStatus).toBe("pending");
    expect(order.fulfillmentStatus).toBe("unfulfilled");
  });

  it("prevents duplicate orders for the same idempotency key", async () => {
    const repo = new InMemoryOrderRepository();
    const first = await repo.create(makeInput({ idempotencyKey: "same-key" }));
    const second = await repo.create(makeInput({ idempotencyKey: "same-key" }));

    expect(second.id).toBe(first.id);
  });

  it("creates separate orders for different idempotency keys", async () => {
    const repo = new InMemoryOrderRepository();
    const first = await repo.create(makeInput({ idempotencyKey: "key-a" }));
    const second = await repo.create(makeInput({ idempotencyKey: "key-b" }));

    expect(second.id).not.toBe(first.id);
  });

  it("updates payment status and transaction id", async () => {
    const repo = new InMemoryOrderRepository();
    const order = await repo.create(makeInput());

    const updated = await repo.updatePaymentStatus(order.id, "paid", "TXN-1");
    expect(updated?.paymentStatus).toBe("paid");
    expect(updated?.providerTransactionId).toBe("TXN-1");
  });

  it("returns null when updating a nonexistent order", async () => {
    const repo = new InMemoryOrderRepository();
    const result = await repo.updatePaymentStatus("does-not-exist", "paid");
    expect(result).toBeNull();
  });

  it("retrieves an order by id", async () => {
    const repo = new InMemoryOrderRepository();
    const order = await repo.create(makeInput());
    const found = await repo.getById(order.id);
    expect(found?.id).toBe(order.id);
  });
});
