import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Faq } from "@/components/faq/Faq";
import { Button } from "@/components/ui/button";
import { faqItems } from "@/content/faq";

export function FaqTeaser() {
  const preview = faqItems.slice(0, 5);

  return (
    <section className="bg-surface-muted py-16 sm:py-24" aria-labelledby="faq-heading">
      <Container>
        <SectionHeading
          eyebrow="שאלות נפוצות"
          title="לפני שרוכשים"
          headingId="faq-heading"
        />

        <div className="mx-auto mt-10 max-w-2xl">
          <Faq items={preview} />
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/faq">כל השאלות הנפוצות</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
