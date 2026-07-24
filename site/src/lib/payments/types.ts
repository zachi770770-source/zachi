/**
 * שכבת ההפשטה של ספק הסליקה. כל ספק (מוק, ישראכרט, טרנזילה, קארדקום,
 * Stripe וכו') צריך לממש את הממשק `PaymentProvider`, כך שניתן להחליף ספק
 * מבלי לשנות קוד באזור ה-checkout או ההזמנות.
 *
 * חשוב: אף מימוש לא אמור לשמור פרטי כרטיס אשראי בשרת של האתר. כל פרטי
 * הכרטיס מטופלים ישירות מול ספק הסליקה (iframe/redirect/tokenization).
 */

export type NormalizedPaymentStatus = "pending" | "success" | "failed" | "cancelled";

export type CreatePaymentSessionInput = {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  cancelUrl: string;
};

export type CreatePaymentSessionResult = {
  sessionId: string;
  redirectUrl: string;
  status: NormalizedPaymentStatus;
};

export type VerifyPaymentResult = {
  status: NormalizedPaymentStatus;
  transactionId: string | null;
  orderId: string | null;
};

export type WebhookResult = {
  /** true אם החתימה תקינה והאירוע טופל. */
  valid: boolean;
  orderId: string | null;
  status: NormalizedPaymentStatus | null;
  transactionId: string | null;
};

export type RefundResult = {
  success: boolean;
  refundId?: string;
};

export interface PaymentProvider {
  readonly name: string;
  /** האם זהו ספק הדגמה (ללא סליקה אמיתית). */
  readonly isDemo: boolean;

  createPaymentSession(
    input: CreatePaymentSessionInput
  ): Promise<CreatePaymentSessionResult>;

  verifyPayment(sessionId: string): Promise<VerifyPaymentResult>;

  handleWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;

  /** הכנה לעתיד - טרם מחובר לתהליך החזר כספי מלא באתר. */
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
}
