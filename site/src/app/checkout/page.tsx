import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { CheckoutClient } from "@/app/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "רכישה",
  description: `רכישת הספר ${siteConfig.bookTitle}.`,
  robots: { index: false, follow: false },
};

/**
 * ה-render חייב להיות דינמי כי הזרימה תלויה ב-query string האמיתי.
 */
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ quantity?: string; payment?: string; format?: string }>;
}) {
  // מצב Pre-launch: המכירה סגורה — אין טופס ואין הדגמת תשלום.
  if (!siteConfig.salesOpen) {
    return (
      <Container className="flex min-h-[60svh] flex-col items-center justify-center py-16 text-center">
        <span className="kicker justify-center">טרום-השקה</span>
        <h1 className="type-h2 mt-4 max-w-[20ch] text-foreground">
          המכירה עדיין לא נפתחה
        </h1>
        <p className="mt-5 max-w-[48ch] text-[18px] leading-relaxed text-foreground-muted">
          אנחנו בשלבי ההשקה האחרונים. עם פתיחת המכירה תתאפשר רכישה מאובטחת של
          המהדורה הדיגיטלית של {siteConfig.bookTitle}.
        </p>
        <Button asChild size="lg" className="mt-8 h-14 px-8 text-[17px]">
          <Link href="/">חזרה לעמוד הבית</Link>
        </Button>
      </Container>
    );
  }

  const { quantity, payment, format } = await searchParams;
  const initialQuantity = Number(quantity) || 1;
  const paymentFailed = payment === "failed";

  const requested = format as keyof typeof siteConfig.products.formats;
  const definition = siteConfig.products.formats[requested];
  const initialFormat =
    definition && definition.available && definition.price != null
      ? requested
      : siteConfig.products.defaultFormat;

  return (
    <Container className="py-10 sm:py-16">
      <h1 className="mb-8 font-serif text-3xl font-semibold">השלמת הרכישה</h1>
      <CheckoutClient
        initialQuantity={initialQuantity}
        initialFormat={initialFormat}
        paymentFailed={paymentFailed}
      />
    </Container>
  );
}
