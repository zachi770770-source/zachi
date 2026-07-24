import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import { getPaymentProvider } from "@/lib/payments";
import { signMockWebhookBody } from "@/lib/payments/mockProvider";
import { processPaymentWebhook } from "@/lib/payments/processWebhook";

const simulateSchema = z.object({
  event: z.enum(["success", "failed", "cancelled"]),
});

/**
 * נתיב זמין רק כאשר ספק התשלום הוא ה-Mock provider (isDemo === true).
 * מדמה קריאת webhook אמיתית מספק סליקה: בונה גוף וחתימה בדיוק כפי
 * שספק אמיתי היה עושה, ומעביר אותם דרך אותו נתיב אימות בדיוק
 * (`processPaymentWebhook`) כמו ה-webhook הציבורי. אינו מבצע חיוב אמיתי.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  if (!siteConfig.salesOpen) {
    return NextResponse.json({ error: "המכירה עדיין לא נפתחה" }, { status: 403 });
  }

  const provider = getPaymentProvider();
  if (!provider.isDemo) {
    return NextResponse.json({ error: "לא זמין" }, { status: 404 });
  }

  const { sessionId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const parsed = simulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "אירוע לא תקין" }, { status: 400 });
  }

  const rawBody = JSON.stringify({ sessionId, event: parsed.data.event });
  const signature = signMockWebhookBody(rawBody);
  const headers = new Headers({ "x-mock-signature": signature });

  const result = await processPaymentWebhook(rawBody, headers);
  if (!result.ok) {
    return NextResponse.json({ error: "עדכון ההזמנה נכשל" }, { status: 400 });
  }

  return NextResponse.json({ status: result.status });
}
