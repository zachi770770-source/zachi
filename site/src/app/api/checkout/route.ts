import { NextResponse, type NextRequest } from "next/server";

import { siteConfig } from "@/config/site";
import { checkoutSchema } from "@/lib/validation/checkout";
import { calculateOrderTotals } from "@/lib/pricing";
import { getOrderRepository } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`checkout:${ip}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסו שוב בעוד דקה." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // מחסום צד-שרת: אפשר לרכוש אך ורק מהדורה שסומנה כזמינה ותומחרה בפועל.
  // מונע יצירת הזמנה למהדורה "בקרוב" (מודפס/חבילה) גם בבקשה מזויפת.
  const format = input.format as keyof typeof siteConfig.products.formats;
  const definition = siteConfig.products.formats[format];
  if (!definition || !definition.available || definition.price == null) {
    return NextResponse.json(
      { error: "המהדורה שנבחרה אינה זמינה לרכישה כרגע." },
      { status: 400 }
    );
  }

  // הסכום מחושב תמיד בצד השרת ולעולם לא נסמך על מחיר שמגיע מהלקוח.
  const totals = calculateOrderTotals(input.quantity, format);
  const repo = getOrderRepository();
  const provider = getPaymentProvider();

  const shippingAddress = definition.requiresShipping
    ? {
        phone: input.phone ?? "",
        city: input.city ?? "",
        street: input.street ?? "",
        houseNumber: input.houseNumber ?? "",
        apartment: input.apartment || undefined,
        zip: input.zip || undefined,
        courierNotes: input.courierNotes || undefined,
      }
    : undefined;

  const order = await repo.create({
    customerName: input.fullName,
    email: input.email,
    format,
    items: [
      {
        title: `${siteConfig.bookTitle} · ${definition.label}`,
        quantity: totals.quantity,
        unitPrice: totals.unitPrice,
      },
    ],
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    currency: totals.currency,
    shippingAddress,
    paymentProvider: provider.name,
    idempotencyKey: input.idempotencyKey,
    marketingConsent: input.marketingConsent,
    giftDedication: input.giftDedication || undefined,
  });

  const session = await provider.createPaymentSession({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: order.currency,
    customerEmail: order.email,
    customerName: order.customerName,
    returnUrl: `${siteConfig.url}/thank-you?order=${order.id}`,
    cancelUrl: `${siteConfig.url}/checkout`,
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    redirectUrl: session.redirectUrl,
  });
}
