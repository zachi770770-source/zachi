import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { outcomes } from "@/content/book";

/**
 * "מה ישתנה אחרי הקריאה" - שתי עמודות עם מספור גדול, ללא כרטיסים.
 */
export function OutcomesSection() {
  return (
    <section
      id="outcomes"
      className="scroll-mt-20 bg-surface-muted py-24 sm:py-32"
      aria-labelledby="outcomes-heading"
    >
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-hover">
            אחרי הקריאה
          </span>
          <h2 id="outcomes-heading" className="type-h2 mt-4">
            {outcomes.title}
          </h2>
        </Reveal>

        <Reveal className="mt-14 grid gap-x-16 gap-y-10 sm:grid-cols-2">
          {outcomes.items.map((item, index) => (
            <div key={item} className="flex items-start gap-5">
              <span
                className="type-quote w-10 shrink-0 text-3xl leading-none text-brand tabular-nums"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-[19px] leading-relaxed text-foreground">
                {item}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
