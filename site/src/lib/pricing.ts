import { siteConfig } from "@/config/site";

export function formatPrice(amount: number, currency: string = siteConfig.commerce.currency) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export type OrderTotals = {
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
};

/**
 * חישוב סכום ההזמנה - תמיד מבוצע בצד השרת (בתוך route handlers) ולעולם לא
 * נסמך על מחיר שמגיע מהלקוח, כדי למנוע מניפולציה על המחיר בדפדפן.
 */
export function calculateOrderTotals(quantity: number): OrderTotals {
  const safeQuantity = Math.min(Math.max(Math.trunc(quantity), 1), 20);
  const unitPrice = siteConfig.commerce.price;
  const subtotal = unitPrice * safeQuantity;

  const freeShipping =
    siteConfig.commerce.freeShippingThreshold !== null &&
    subtotal >= siteConfig.commerce.freeShippingThreshold;

  const shipping = freeShipping ? 0 : siteConfig.commerce.shippingFlatRate;
  const discount = 0;
  const total = subtotal + shipping - discount;

  return {
    quantity: safeQuantity,
    unitPrice,
    subtotal,
    shipping,
    discount,
    total,
    currency: siteConfig.commerce.currency,
  };
}
