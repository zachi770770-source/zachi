import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";

import type {
  PaymentProvider,
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  VerifyPaymentResult,
  WebhookResult,
  RefundResult,
  NormalizedPaymentStatus,
} from "@/lib/payments/types";

type MockSession = {
  sessionId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: NormalizedPaymentStatus;
  transactionId: string | null;
};

const globalForMock = globalThis as unknown as {
  mockPaymentSessions?: Map<string, MockSession>;
};

function getStore() {
  if (!globalForMock.mockPaymentSessions) {
    globalForMock.mockPaymentSessions = new Map();
  }
  return globalForMock.mockPaymentSessions;
}

function getWebhookSecret() {
  return process.env.PAYMENT_WEBHOOK_SECRET || "mock-dev-webhook-secret";
}

export function signMockWebhookBody(rawBody: string): string {
  return createHmac("sha256", getWebhookSecret()).update(rawBody).digest("hex");
}

/**
 * ספק תשלום לדוגמה (Demo/Test) לשימוש בפיתוח וכשאין עדיין ספק סליקה
 * ישראלי מחובר. אינו מבצע שום חיוב אמיתי. ראו README.md להוראות חיבור
 * ספק אמיתי (`PAYMENT_PROVIDER`, `PAYMENT_API_KEY` וכו').
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  readonly isDemo = true;

  async createPaymentSession(
    input: CreatePaymentSessionInput
  ): Promise<CreatePaymentSessionResult> {
    const sessionId = randomUUID();
    getStore().set(sessionId, {
      sessionId,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      transactionId: null,
    });

    return {
      sessionId,
      redirectUrl: `/checkout/pay/${sessionId}`,
      status: "pending",
    };
  }

  async verifyPayment(sessionId: string): Promise<VerifyPaymentResult> {
    const session = getStore().get(sessionId);
    if (!session) {
      return { status: "failed", transactionId: null, orderId: null };
    }
    return {
      status: session.status,
      transactionId: session.transactionId,
      orderId: session.orderId,
    };
  }

  async handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult> {
    const signature = headers.get("x-mock-signature");
    const expected = signMockWebhookBody(rawBody);

    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return { valid: false, orderId: null, status: null, transactionId: null };
    }

    let payload: { sessionId?: string; event?: string };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { valid: false, orderId: null, status: null, transactionId: null };
    }

    const session = payload.sessionId ? getStore().get(payload.sessionId) : null;
    if (!session) {
      return { valid: false, orderId: null, status: null, transactionId: null };
    }

    const status: NormalizedPaymentStatus =
      payload.event === "success"
        ? "success"
        : payload.event === "cancelled"
          ? "cancelled"
          : "failed";

    session.status = status;
    session.transactionId = status === "success" ? `MOCK-${randomUUID()}` : session.transactionId;
    getStore().set(session.sessionId, session);

    return {
      valid: true,
      orderId: session.orderId,
      status,
      transactionId: session.transactionId,
    };
  }

  async refundPayment(transactionId: string): Promise<RefundResult> {
    return { success: true, refundId: `MOCK-REFUND-${transactionId}` };
  }
}
