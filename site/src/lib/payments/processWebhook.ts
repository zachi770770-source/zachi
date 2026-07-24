import { getPaymentProvider } from "@/lib/payments";
import { getOrderRepository } from "@/lib/orders";
import type { PaymentStatus } from "@/lib/orders/types";
import type { NormalizedPaymentStatus } from "@/lib/payments/types";

function toOrderPaymentStatus(status: NormalizedPaymentStatus): PaymentStatus {
  if (status === "success") return "paid";
  if (status === "cancelled") return "cancelled";
  if (status === "pending") return "pending";
  return "failed";
}

/**
 * מטפל אחיד באירועי webhook מספק התשלום: מאמת חתימה, מנרמל סטטוס
 * ומעדכן את ההזמנה במאגר. נקרא הן מ-route ה-webhook האמיתי והן מ-route
 * הסימולציה של ספק ה-Mock, כך שאותו נתיב קוד מאומת נבדק בשני המקרים.
 */
export async function processPaymentWebhook(rawBody: string, headers: Headers) {
  const provider = getPaymentProvider();
  const result = await provider.handleWebhook(rawBody, headers);

  if (!result.valid || !result.orderId || !result.status) {
    return { ok: false as const };
  }

  const repo = getOrderRepository();
  const order = await repo.updatePaymentStatus(
    result.orderId,
    toOrderPaymentStatus(result.status),
    result.transactionId
  );

  if (!order) {
    return { ok: false as const };
  }

  return { ok: true as const, orderId: order.id, status: order.paymentStatus };
}
