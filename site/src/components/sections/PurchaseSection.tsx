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
      // רקע-נייר (הקנבס), לא בנד-muted: OutcomesSection שמעליו כבר משתמש
      // ב-bg-surface-muted, וכששני הבנדים צמודים הם נמזגים לגוש-muted אחד ארוך.
      // כאן ה„צעד הבא” יושב על הקנבס הנקי — כרטיס-הרכישה המוגבה נושא את רגע-הסגירה
      // (כמו סגירת עמוד-הבית: סקשן שקוף, פאנל מובחן) — והבנד של Outcomes נשאר יחיד.
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="purchase-heading"
    >
      <Container>
        {/* חשיפה אחת — כותרת הסיכום וכרטיס הרכישה נכנסים יחד. */}
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="kicker">
              הצעד הבא
            </span>
            <h2 id="purchase-heading" className="type-h2 mt-4">
              {closing.title}
            </h2>
          </div>

          <div className="mx-auto mt-14 max-w-3xl">
            <PurchaseCard />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
