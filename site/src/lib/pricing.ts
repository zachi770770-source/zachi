import { siteConfig } from "@/config/site";

export function formatPrice(amount: number, currency: string = siteConfig.commerce.currency) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** מזהי המהדורות הנתמכות. */
export type ProductFormat = keyof typeof siteConfig.products.formats;

export type OrderTotals = {
  format: ProductFormat;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  /** עלות משלוח - תמיד 0 למהדורה דיגיטלית. */
  shipping: number;
  total: number;
  currency: string;
};

/**
 * חישוב סכום ההזמנה - תמיד מבוצע בצד השרת (בתוך route handlers) ולעולם לא
 * נסמך על מחיר שמגיע מהלקוח, כדי למנוע מניפולציה על המחיר בדפדפן.
 *
 * המשלוח מתווסף אך ורק למהדורה שמסומנת `requiresShipping` וכאשר הוגדרה
 * תעריף משלוח אמיתי ב-config. כל עוד `shipping.flatRate` הוא null (טרם נקבע)
 * לא מתווספת עלות משלוח - אין להמציא מחיר משלוח.
 */
export function calculateOrderTotals(
  quantity: number,
  format: ProductFormat = siteConfig.products.defaultFormat
): OrderTotals {
  const safeQuantity = Math.min(Math.max(Math.trunc(quantity), 1), 20);
  const definition = siteConfig.products.formats[format];
  // מחיר null = מהדורה שטרם תומחרה; מתייחסים אליה כאפס עד שייקבע מחיר אמיתי.
  const unitPrice = definition.price ?? 0;
  const subtotal = unitPrice * safeQuantity;
  const discount = 0;

  let shipping = 0;
  if (definition.requiresShipping) {
    const flatRate = siteConfig.shipping.flatRate;
    const threshold = siteConfig.shipping.freeShippingThreshold;
    if (flatRate != null) {
      const qualifiesForFree = threshold != null && subtotal >= threshold;
      shipping = qualifiesForFree ? 0 : flatRate;
    }
  }

  const total = subtotal - discount + shipping;

  return {
    format,
    quantity: safeQuantity,
    unitPrice,
    subtotal,
    discount,
    shipping,
    total,
    currency: siteConfig.commerce.currency,
  };
}
