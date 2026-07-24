import type { PaymentProvider } from "@/lib/payments/types";
import { MockPaymentProvider } from "@/lib/payments/mockProvider";

const globalForPayments = globalThis as unknown as {
  paymentProvider?: PaymentProvider;
};

/**
 * מפעל ספק התשלום. הבחירה נעשית לפי משתנה הסביבה `PAYMENT_PROVIDER`.
 *
 * לחיבור ספק סליקה ישראלי אמיתי (למשל טרנזילה, קארדקום, ישראכרט,
 * Meshulam וכו'): צרו מחלקה חדשה שמממשת את `PaymentProvider`
 * (src/lib/payments/types.ts), ורשמו אותה כאן לפי ערך `PAYMENT_PROVIDER`.
 * לא נדרש שינוי בשום קובץ אחר - כל קריאה ל-checkout עוברת דרך הממשק הזה.
 */
export function getPaymentProvider(): PaymentProvider {
  if (!globalForPayments.paymentProvider) {
    const provider = process.env.PAYMENT_PROVIDER || "mock";

    switch (provider) {
      case "mock":
        globalForPayments.paymentProvider = new MockPaymentProvider();
        break;
      default:
        throw new Error(
          `[payments] PAYMENT_PROVIDER="${provider}" אינו מחובר עדיין. ` +
            "ממשו PaymentProvider חדש תחת src/lib/payments ורשמו אותו ב-getPaymentProvider(). ראו README.md."
        );
    }
  }
  return globalForPayments.paymentProvider;
}

export type {
  PaymentProvider,
  NormalizedPaymentStatus,
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  VerifyPaymentResult,
  WebhookResult,
  RefundResult,
} from "@/lib/payments/types";
