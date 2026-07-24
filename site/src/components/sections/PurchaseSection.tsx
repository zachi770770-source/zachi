import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PurchaseCard } from "@/components/purchase/PurchaseCard";

export function PurchaseSection() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="purchase-heading">
      <Container>
        <SectionHeading
          eyebrow="רכישה"
          title="קחו את הספר איתכם"
          description="Guest checkout מהיר, ללא צורך בהרשמה. כל העלויות מוצגות במלואן לפני התשלום."
          headingId="purchase-heading"
          className="mb-10"
        />
        <div className="mx-auto max-w-xl">
          <PurchaseCard />
        </div>
      </Container>
    </section>
  );
}
