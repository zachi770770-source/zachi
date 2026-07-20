/**
 * דוגמה לא-מחוברת (reference implementation) לחיבור בסיס נתונים אמיתי
 * (PostgreSQL רגיל, או Supabase שמבוסס Postgres) למאגר ההזמנות.
 *
 * קובץ זה אינו נטען משום מקום באתר בפועל - הוא תבנית להעתקה.
 * כדי להשתמש בו:
 *
 * 1. התקינו קליינט Postgres, לדוגמה: `npm install pg` או
 *    `npm install @supabase/supabase-js`.
 * 2. הגדירו משתנה סביבה `DATABASE_URL` (או פרטי Supabase המתאימים).
 * 3. ממשו טבלת `orders` עם העמודות המפורטות ב-`Order`
 *    (src/lib/orders/types.ts).
 * 4. החליפו את גוף המתודות למטה בקריאות SQL/Supabase אמיתיות.
 * 5. עדכנו את `getOrderRepository` ב-src/lib/orders/index.ts כך שיחזיר
 *    מופע של המחלקה הזו במקום `InMemoryOrderRepository`.
 *
 * הממשק `OrderRepository` נשאר זהה - שאר קוד האתר לא צריך להשתנות.
 */

import type { OrderRepository } from "@/lib/orders/repository";
import type { CreateOrderInput, Order, PaymentStatus } from "@/lib/orders/types";

/** מייצג קליינט מסד נתונים גנרי - החליפו בקליינט האמיתי שבחרתם. */
interface SqlClient {
  query<T>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly db: SqlClient) {}

  async create(input: CreateOrderInput): Promise<Order> {
    const existing = await this.getByIdempotencyKey(input.idempotencyKey);
    if (existing) return existing;

    const { rows } = await this.db.query<Order>(
      `insert into orders (
         customer_name, phone, email, shipping_address, items,
         subtotal, shipping, discount, total, currency,
         payment_provider, idempotency_key, marketing_consent, notes, gift_dedication,
         payment_status, fulfillment_status
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending','unfulfilled')
       returning *`,
      [
        input.customerName,
        input.phone,
        input.email,
        JSON.stringify(input.shippingAddress),
        JSON.stringify(input.items),
        input.subtotal,
        input.shipping,
        input.discount,
        input.total,
        input.currency,
        input.paymentProvider,
        input.idempotencyKey,
        input.marketingConsent,
        input.notes ?? null,
        input.giftDedication ?? null,
      ]
    );
    return rows[0];
  }

  async getById(id: string): Promise<Order | null> {
    const { rows } = await this.db.query<Order>(
      `select * from orders where id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async getByIdempotencyKey(key: string): Promise<Order | null> {
    const { rows } = await this.db.query<Order>(
      `select * from orders where idempotency_key = $1`,
      [key]
    );
    return rows[0] ?? null;
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    providerTransactionId?: string | null
  ): Promise<Order | null> {
    const { rows } = await this.db.query<Order>(
      `update orders set payment_status = $2, provider_transaction_id = coalesce($3, provider_transaction_id), updated_at = now()
       where id = $1 returning *`,
      [id, status, providerTransactionId ?? null]
    );
    return rows[0] ?? null;
  }
}
