import type { CreateOrderInput, Order, PaymentStatus } from "@/lib/orders/types";

/**
 * חוזה שכבת האחסון של הזמנות. כל מימוש (זיכרון, Postgres, Supabase)
 * צריך לעמוד בממשק הזה, כך שאפשר להחליף מימוש מבלי לגעת בקוד ה-API.
 */
export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  getByIdempotencyKey(key: string): Promise<Order | null>;
  updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    providerTransactionId?: string | null
  ): Promise<Order | null>;
}
