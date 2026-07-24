import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { Faq } from "@/components/faq/Faq";
import { Button } from "@/components/ui/button";
import { faqItems } from "@/content/faq";

export function FaqTeaser() {
  const preview = faqItems.slice(0, 5);

  return (
    <section
      id="faq"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="faq-heading"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="kicker">
              שאלות נפוצות
            </span>
            <h2 id="faq-heading" className="type-h2 mt-4">
              לפני שרוכשים
            </h2>
            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/faq">כל השאלות הנפוצות</Link>
              </Button>
            </div>
          </div>

          <div>
            <Faq items={preview} />
          </div>
        </div>
      </Container>
    </section>
  );
}
