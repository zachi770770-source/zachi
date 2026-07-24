import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { problem } from "@/content/book";

/**
 * "למי הספר הזה" - פריסה עריכתית מפוצלת (כותרת+סגירה מול רשימת מצבים),
 * לא רשת כרטיסים זהים.
 */
export function AudienceSection() {
  const situations = problem.situations.slice(0, 4);

  return (
    <section
      id="audience"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="audience-heading"
    >
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <span className="kicker">
              למי הספר הזה
            </span>
            <h2 id="audience-heading" className="type-h2 mt-4">
              {problem.title}
            </h2>
            <p className="type-lead mt-6 max-w-[48ch] text-foreground-muted">
              {problem.closing}
            </p>
          </Reveal>

          <Reveal className="flex flex-col">
            {situations.map((situation, index) => (
              <div
                key={situation}
                className="flex items-baseline gap-5 border-t border-border py-6 last:border-b"
              >
                <span
                  className="type-quote shrink-0 text-2xl text-brand/70 tabular-nums"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-[19px] leading-relaxed text-foreground">
                  {situation}
                </p>
              </div>
            ))}
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
