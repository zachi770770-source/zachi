import { randomUUID } from "node:crypto";

import type { OrderRepository } from "@/lib/orders/repository";
import type { CreateOrderInput, Order, PaymentStatus } from "@/lib/orders/types";

/**
 * מימוש זמני-בזיכרון של מאגר ההזמנות, מיועד לפיתוח ולהדגמה בלבד.
 *
 * חשוב: אחסון בזיכרון אינו עמיד ל-restart של השרת ואינו משותף בין
 * מספר instances (כפי שקורה בפריסות serverless/edge). לפני עלייה
 * לפרודקשן אמיתית יש להחליף מימוש זה במאגר מתמשך (PostgreSQL/Supabase)
 * שמיישם את `OrderRepository` - ראו README.md, סעיף "חיבור בסיס נתונים".
 */
export class InMemoryOrderRepository implements OrderRepository {
  private orders = new Map<string, Order>();
  private idempotencyIndex = new Map<string, string>();
  private sequence = 1000;

  async create(input: CreateOrderInput): Promise<Order> {
    const existingId = this.idempotencyIndex.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.orders.get(existingId);
      if (existing) return existing;
    }

    const now = new Date().toISOString();
    const order: Order = {
      ...input,
      id: randomUUID(),
      orderNumber: `MLA-${this.sequence++}`,
      createdAt: now,
      updatedAt: now,
      paymentStatus: "pending",
      fulfillmentStatus: "unfulfilled",
      providerTransactionId: null,
    };

    this.orders.set(order.id, order);
    this.idempotencyIndex.set(order.idempotencyKey, order.id);
    return order;
  }

  async getById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async getByIdempotencyKey(key: string): Promise<Order | null> {
    const id = this.idempotencyIndex.get(key);
    if (!id) return null;
    return this.orders.get(id) ?? null;
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    providerTransactionId?: string | null
  ): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order) return null;

    order.paymentStatus = status;
    if (providerTransactionId !== undefined) {
      order.providerTransactionId = providerTransactionId;
    }
    order.updatedAt = new Date().toISOString();
    this.orders.set(id, order);
    return order;
  }
}
