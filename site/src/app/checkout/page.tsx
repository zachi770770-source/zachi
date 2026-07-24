import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { CheckoutClient } from "@/app/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "רכישה",
  description: `השלמת רכישת הספר ${siteConfig.bookTitle} - תהליך קצר, ללא צורך בהרשמה.`,
  robots: { index: false, follow: false },
};

/**
 * ה-render חייב להיות דינמי כי הכמות ההתחלתית תלויה ב-query string
 * האמיתי של הבקשה (מגיע מ-PurchaseCard: /checkout?quantity=N).
 */
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ quantity?: string; payment?: string }>;
}) {
  const { quantity, payment } = await searchParams;
  const initialQuantity = Number(quantity) || 1;
  const paymentFailed = payment === "failed";

  return (
    <Container className="py-10 sm:py-16">
      <h1 className="mb-8 font-serif text-3xl font-semibold">
        השלמת הרכישה
      </h1>
      <CheckoutClient initialQuantity={initialQuantity} paymentFailed={paymentFailed} />
    </Container>
  );
}
