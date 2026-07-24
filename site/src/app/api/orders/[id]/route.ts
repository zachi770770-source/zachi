import { NextResponse } from "next/server";

import { getOrderRepository } from "@/lib/orders";

/**
 * מחזיר סיכום הזמנה לעמוד התודה. הגישה מתבססת על מזהה ההזמנה (UUID
 * אקראי ולא ניחוש) שמוחזר ללקוח רק מיד לאחר יצירת ההזמנה - אין צורך
 * בהרשמה ל-Guest checkout. זהו מקור האמת לאישור התשלום בעמוד התודה;
 * העמוד עצמו אינו סומך על פרמטרים כלשהם ב-URL מלבד מזהה זה.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const order = await getOrderRepository().getById(id);

  if (!order) {
    return NextResponse.json({ error: "הזמנה לא נמצאה" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
