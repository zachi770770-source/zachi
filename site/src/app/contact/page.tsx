import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "יצירת קשר",
  description: `יצירת קשר בנוגע לספר ${siteConfig.bookTitle} או להזמנה קיימת.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          יצירת קשר
        </h1>
        <p className="mt-3 text-lg text-foreground-muted">
          שאלה על ההזמנה, על הספר, או כל דבר אחר - נשמח לעזור.
        </p>

        <div className="mt-8">
          <ContactForm />
        </div>
      </div>
    </Container>
  );
}
