import { NextResponse } from "next/server";

import { getPaymentProvider } from "@/lib/payments";
import { getOrderRepository } from "@/lib/orders";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  const provider = getPaymentProvider();
  if (!provider.isDemo) {
    return NextResponse.json({ error: "לא זמין" }, { status: 404 });
  }

  const { sessionId } = await context.params;
  const verification = await provider.verifyPayment(sessionId);
  if (!verification.orderId) {
    return NextResponse.json({ error: "session לא נמצא" }, { status: 404 });
  }

  const order = await getOrderRepository().getById(verification.orderId);
  if (!order) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    currency: order.currency,
    status: verification.status,
  });
}
