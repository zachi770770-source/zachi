import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, Mail } from "lucide-react";

import { siteConfig } from "@/config/site";
import { getOrderRepository } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "תודה על הרכישה",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  if (!orderId) {
    notFound();
  }

  // אישור התשלום נשלף תמיד ישירות מהמאגר בצד השרת - העמוד אינו סומך
  // על שום דגל הצלחה שמגיע דרך ה-URL.
  const order = await getOrderRepository().getById(orderId);

  if (!order) {
    notFound();
  }

  const isPaid = order.paymentStatus === "paid";
  const isPending = order.paymentStatus === "pending";

  return (
    <Container className="flex flex-col items-center py-16 text-center">
      <div className="w-full max-w-lg">
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
            isPaid
              ? "bg-success/15 text-success"
              : "bg-warning/15 text-warning"
          }`}
        >
          {isPaid ? (
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          ) : (
            <Clock3 className="h-7 w-7" aria-hidden="true" />
          )}
        </div>

        <h1 className="font-serif text-3xl font-semibold">
          {isPaid
            ? "תודה! ההזמנה התקבלה בהצלחה"
            : isPending
              ? "התשלום עדיין בעיבוד"
              : "התשלום לא הושלם"}
        </h1>

        <p className="mt-3 text-lg text-foreground-muted">
          מספר הזמנה: <span className="font-semibold text-foreground">{order.orderNumber}</span>
        </p>

        {isPaid ? (
          <>
            <div className="mt-8 rounded-lg border border-border bg-surface-muted p-6 text-start">
              <h2 className="font-serif text-lg font-semibold">סיכום ההזמנה</h2>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {order.items.map((item) => (
                  <li key={item.title} className="flex justify-between">
                    <span className="text-foreground-muted">
                      {item.title} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
                <span>סה&quot;כ</span>
                <span>{formatPrice(order.total, order.currency)}</span>
              </div>

              <h3 className="mt-5 font-serif text-base font-semibold">
                כתובת למשלוח
              </h3>
              <p className="mt-1 text-sm text-foreground-muted">
                {order.shippingAddress.street} {order.shippingAddress.houseNumber}
                {order.shippingAddress.apartment
                  ? `, דירה ${order.shippingAddress.apartment}`
                  : ""}
                , {order.shippingAddress.city}
                {order.shippingAddress.zip ? ` ${order.shippingAddress.zip}` : ""}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-sm text-foreground-muted">
              <p className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" aria-hidden="true" />
                אישור הזמנה נשלח לכתובת {order.email}
              </p>
              <p>
                זמן אספקה משוער: {siteConfig.commerce.estimatedDeliveryText}
              </p>
              {siteConfig.bonus.enabled && siteConfig.bonus.includedInPrice ? (
                <p>חוברת העבודה הדיגיטלית {siteConfig.bonus.deliveryTiming}.</p>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-6 text-base leading-relaxed text-foreground-muted">
            {isPending
              ? "אנחנו עדיין מחכים לאישור התשלום מספק הסליקה. אם המצב לא מתעדכן בדקות הקרובות, צרו איתנו קשר."
              : "נראה שהתשלום לא הושלם בהצלחה. ניתן לנסות שוב או לפנות אלינו לעזרה."}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/contact">יצירת קשר</Link>
          </Button>
          {!isPaid ? (
            <Button asChild>
              <Link href="/checkout">חזרה לרכישה</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
