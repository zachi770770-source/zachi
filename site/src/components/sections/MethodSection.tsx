import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { method } from "@/content/book";

const PHASES = ["חיפוש", "בחירה", "בנייה"];

/**
 * "השיטה" - רצף ויזואלי של שלושה שלבים. בדסקטופ ציר אופקי עם קו מחבר;
 * במובייל ציר אנכי. ללא כרטיסים מבודדים.
 */
export function MethodSection() {
  return (
    <section
      id="method"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="method-heading"
    >
      <Container>
        <Reveal className="max-w-2xl">
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-hover">
            השיטה
          </span>
          <h2 id="method-heading" className="type-h2 mt-4">
            {method.title}
          </h2>
          <p className="type-lead mt-6 max-w-[46ch] text-foreground-muted">
            {method.description}
          </p>
        </Reveal>

        <Reveal className="relative mt-16">
          {/* קו ציר: אופקי בדסקטופ, אנכי במובייל */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[22px] hidden h-px bg-border sm:block"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-2 top-2 right-[22px] w-px bg-border sm:hidden"
          />

          <ol className="grid gap-12 sm:grid-cols-3 sm:gap-10">
            {method.steps.map((step, index) => (
              <li key={step.number} className="relative ps-16 sm:ps-0">
                <div className="flex items-center gap-4 sm:flex-col sm:items-start">
                  <span className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-[17px] font-bold text-brand-foreground sm:static">
                    {String(index + 1)}
                  </span>
                </div>
                <span className="mt-0 block text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-hover sm:mt-6">
                  {PHASES[index]}
                </span>
                <h3 className="mt-2 text-[22px] font-bold">{step.title}</h3>
                <p className="mt-3 text-[17px] leading-relaxed text-foreground-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-14">
          <Link
            href="/#inside"
            className="inline-flex items-center gap-2 text-[17px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {method.linkLabel}
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
