import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { PurchaseCard } from "@/components/purchase/PurchaseCard";
import { closing } from "@/content/book";

/**
 * אזור הרכישה המרכזי (יעד ה-CTA #purchase). משפט סיכום רגשי אחד,
 * ולצידו כרטיס הרכישה עם עטיפה, מחיר, מה כלול וכפתור רכישה בולט.
 */
export function PurchaseSection() {
  return (
    <section
      className="scroll-mt-20 bg-surface-muted py-24 sm:py-32"
      aria-labelledby="purchase-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker">
            הצעד הבא
          </span>
          <h2 id="purchase-heading" className="type-h2 mt-4">
            {closing.title}
          </h2>
        </Reveal>

        <Reveal className="mx-auto mt-14 max-w-3xl">
          <PurchaseCard />
        </Reveal>
      </Container>
    </section>
  );
}
