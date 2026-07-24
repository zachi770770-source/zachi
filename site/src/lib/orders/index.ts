import type { OrderRepository } from "@/lib/orders/repository";
import { InMemoryOrderRepository } from "@/lib/orders/inMemoryRepository";

let warned = false;

/**
 * מחזיר את מימוש מאגר ההזמנות הפעיל.
 *
 * כרגע תמיד מוחזר מימוש בזיכרון (`InMemoryOrderRepository`), כדי שהאתר
 * יעבוד מקצה לקצה גם בלי בסיס נתונים מחובר. ה-singleton נשמר על
 * `globalThis` כדי לשרוד Hot Reload בפיתוח.
 *
 * לחיבור בסיס נתונים אמיתי (PostgreSQL / Supabase): ממשו את
 * `OrderRepository` (ראו repository.ts) במחלקה חדשה, והחליפו כאן את
 * ה-`new InMemoryOrderRepository()` במימוש החדש. אין צורך לשנות קוד
 * בשום מקום אחר באתר.
 */
const globalForOrders = globalThis as unknown as {
  orderRepository?: OrderRepository;
};

export function getOrderRepository(): OrderRepository {
  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn(
      "[orders] משתמש במאגר הזמנות בזיכרון בסביבת production. " +
        "הזמנות לא יישמרו לאחר restart של השרת. יש לחבר בסיס נתונים אמיתי - ראו README.md."
    );
  }

  if (!globalForOrders.orderRepository) {
    globalForOrders.orderRepository = new InMemoryOrderRepository();
  }
  return globalForOrders.orderRepository;
}

export type {
  Order,
  CreateOrderInput,
  OrderItem,
  ShippingAddress,
  PaymentStatus,
  FulfillmentStatus,
} from "@/lib/orders/types";
