import { describe, expect, it } from "vitest";

import { MockPaymentProvider, signMockWebhookBody } from "@/lib/payments/mockProvider";

describe("MockPaymentProvider", () => {
  it("creates a pending session with a redirect url", async () => {
    const provider = new MockPaymentProvider();
    const session = await provider.createPaymentSession({
      orderId: "order-1",
      orderNumber: "MLA-1000",
      amount: 123,
      currency: "ILS",
      customerEmail: "test@example.com",
      customerName: "ישראל ישראלי",
      returnUrl: "https://example.com/thank-you",
      cancelUrl: "https://example.com/checkout",
    });

    expect(session.status).toBe("pending");
    expect(session.redirectUrl).toContain(session.sessionId);
  });

  it("rejects a webhook with an invalid signature", async () => {
    const provider = new MockPaymentProvider();
    const session = await provider.createPaymentSession({
      orderId: "order-2",
      orderNumber: "MLA-1001",
      amount: 98,
      currency: "ILS",
      customerEmail: "test@example.com",
      customerName: "ישראל ישראלי",
      returnUrl: "https://example.com/thank-you",
      cancelUrl: "https://example.com/checkout",
    });

    const rawBody = JSON.stringify({ sessionId: session.sessionId, event: "success" });
    const result = await provider.handleWebhook(
      rawBody,
      new Headers({ "x-mock-signature": "not-the-real-signature" })
    );

    expect(result.valid).toBe(false);
  });

  it("accepts a correctly signed success webhook and updates the session", async () => {
    const provider = new MockPaymentProvider();
    const session = await provider.createPaymentSession({
      orderId: "order-3",
      orderNumber: "MLA-1002",
      amount: 98,
      currency: "ILS",
      customerEmail: "test@example.com",
      customerName: "ישראל ישראלי",
      returnUrl: "https://example.com/thank-you",
      cancelUrl: "https://example.com/checkout",
    });

    const rawBody = JSON.stringify({ sessionId: session.sessionId, event: "success" });
    const signature = signMockWebhookBody(rawBody);
    const result = await provider.handleWebhook(
      rawBody,
      new Headers({ "x-mock-signature": signature })
    );

    expect(result.valid).toBe(true);
    expect(result.status).toBe("success");
    expect(result.orderId).toBe("order-3");
    expect(result.transactionId).toBeTruthy();

    const verified = await provider.verifyPayment(session.sessionId);
    expect(verified.status).toBe("success");
  });

  it("normalizes a failed event correctly", async () => {
    const provider = new MockPaymentProvider();
    const session = await provider.createPaymentSession({
      orderId: "order-4",
      orderNumber: "MLA-1003",
      amount: 98,
      currency: "ILS",
      customerEmail: "test@example.com",
      customerName: "ישראל ישראלי",
      returnUrl: "https://example.com/thank-you",
      cancelUrl: "https://example.com/checkout",
    });

    const rawBody = JSON.stringify({ sessionId: session.sessionId, event: "failed" });
    const signature = signMockWebhookBody(rawBody);
    const result = await provider.handleWebhook(
      rawBody,
      new Headers({ "x-mock-signature": signature })
    );

    expect(result.status).toBe("failed");
  });
});
