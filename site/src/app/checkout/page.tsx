import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
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
  // מצב Pre-launch: המכירה סגורה — אין טופס תשלום/הזמנה, רק רשימת המתנה.
  if (!siteConfig.salesOpen) {
    return (
      <Container className="flex flex-col items-center py-16 sm:py-20">
        <div className="w-full max-w-md text-center">
          <span className="kicker justify-center">טרום-השקה</span>
          <h1 className="type-h2 mt-4 text-foreground">המכירה עדיין לא נפתחה</h1>
          <p className="mt-5 text-[18px] leading-relaxed text-foreground-muted">
            השאירו אימייל ונעדכן אתכם ראשונים כשהמהדורה הדיגיטלית תיפתח לרכישה.
          </p>
          <div className="mt-8 text-start">
            <WaitlistForm source="checkout_closed" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/preview"
              className="text-[16px] font-semibold text-brand-hover underline underline-offset-4 hover:text-foreground"
            >
              לקריאת טעימה מהספר
            </Link>
            <Link
              href="/"
              className="text-[14px] text-foreground-muted underline underline-offset-4 hover:text-foreground"
            >
              חזרה לעמוד הבית
            </Link>
          </div>
        </div>
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
