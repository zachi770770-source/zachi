/**
 * מודל הנתונים של הזמנה. משמש הן את שכבת האחסון (store.ts) והן את
 * ה-route handlers תחת app/api/checkout ו-app/api/webhooks.
 */

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ShippingAddress = {
  city: string;
  street: string;
  houseNumber: string;
  apartment?: string;
  zip?: string;
  courierNotes?: string;
};

export type OrderItem = {
  title: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;

  customerName: string;
  phone: string;
  email: string;
  shippingAddress: ShippingAddress;

  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;

  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentProvider: string;
  providerTransactionId: string | null;
  /** מזהה אידמפוטנטיות שנשלח מהלקוח, מונע יצירת הזמנה כפולה בלחיצה כפולה. */
  idempotencyKey: string;

  marketingConsent: boolean;
  notes?: string;
  giftDedication?: string;
};

export type CreateOrderInput = Omit<
  Order,
  | "id"
  | "orderNumber"
  | "createdAt"
  | "updatedAt"
  | "paymentStatus"
  | "fulfillmentStatus"
  | "providerTransactionId"
>;
