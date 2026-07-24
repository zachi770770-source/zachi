import { NextResponse, type NextRequest } from "next/server";

import { processPaymentWebhook } from "@/lib/payments/processWebhook";

/**
 * נקודת הכניסה שספק הסליקה קורא לה אסינכרונית כדי לעדכן סטטוס תשלום.
 * החתימה מאומתת בתוך הספק עצמו (`provider.handleWebhook`). אל תוסיפו כאן
 * לוגיקה עסקית - כל הלוגיקה מרוכזת ב-processPaymentWebhook כדי שגם
 * נתיב הסימולציה של ה-Mock provider ישתמש באותה בדיקת אימות בדיוק.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const result = await processPaymentWebhook(rawBody, request.headers);

  if (!result.ok) {
    return NextResponse.json({ error: "אירוע לא תקין" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
