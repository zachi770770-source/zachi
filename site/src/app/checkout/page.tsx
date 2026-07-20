import type { Metadata } from "next";
import { Suspense } from "react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { CheckoutClient } from "@/app/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "רכישה",
  description: `השלמת רכישת הספר ${siteConfig.bookTitle} - תהליך קצר, ללא צורך בהרשמה.`,
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Container className="py-10 sm:py-16">
      <h1 className="mb-8 font-serif text-3xl font-semibold">
        השלמת הרכישה
      </h1>
      <Suspense fallback={<div className="text-foreground-muted">טוען...</div>}>
        <CheckoutClient />
      </Suspense>
    </Container>
  );
}
