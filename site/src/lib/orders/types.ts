/**
 * מודל הנתונים של הזמנה. משמש הן את שכבת האחסון (store.ts) והן את
 * ה-route handlers תחת app/api/checkout ו-app/api/webhooks.
 */

import type { ProductFormat } from "@/lib/pricing";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

/**
 * סטטוס אספקה. מהדורה דיגיטלית: לאחר תשלום מאומת מוענקת גישה
 * (access_granted). מהדורה מודפסת/חבילה: נשלחת ואז נמסרת.
 */
export type FulfillmentStatus =
  | "unfulfilled"
  | "access_granted"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  title: string;
  quantity: number;
  unitPrice: number;
};

/** כתובת למשלוח - קיימת רק בהזמנות של מהדורה מודפסת/חבילה. */
export type ShippingAddress = {
  phone: string;
  city: string;
  street: string;
  houseNumber: string;
  apartment?: string;
  zip?: string;
  courierNotes?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;

  customerName: string;
  email: string;

  /** המהדורה שנרכשה. */
  format: ProductFormat;

  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;

  /** קיים רק כאשר המהדורה דורשת משלוח. */
  shippingAddress?: ShippingAddress;

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
