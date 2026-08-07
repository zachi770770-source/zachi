import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";

/**
 * „למה הספר שונה” — אזור קצר שמסביר את ערך הספר בשלושה צעדים: לזהות → להבחין →
 * לעשות. בלי מסך ענק ובלי טקסטים ארוכים. בסופו קישור יחיד לעמוד הספר.
 */
const STEPS = [
  { num: "01", verb: "לזהות", line: "להבין מה באמת קורה." },
  {
    num: "02",
    verb: "להבחין",
    line: "להפריד בין פחד, סיפור, משיכה, ערכים ודפוס.",
  },
  { num: "03", verb: "לעשות", line: "לקבל כלי או פעולה שאפשר לקחת לחיים." },
] as const;

export function HomeWhyDifferent() {
  return (
    <section
      id="why-different"
      className="scroll-mt-20 py-12 sm:py-14"
      aria-labelledby="why-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 id="why-heading" className="type-h2">
            למה הספר שונה
          </h2>
        </Reveal>

        <ol className="mx-auto mt-8 grid max-w-4xl gap-3.5 sm:grid-cols-3">
          {STEPS.map(({ num, verb, line }) => (
            <li
              key={num}
              className="reveal flex flex-col rounded-2xl border border-border bg-surface p-5"
            >
              <span
                className="font-serif text-[1.1rem] font-bold text-brand"
                aria-hidden="true"
              >
                {num}
              </span>
              <span className="mt-2 font-serif text-[1.2rem] font-semibold text-foreground">
                {verb}
              </span>
              <span className="mt-1.5 text-[14.5px] leading-snug text-foreground-muted [text-wrap:pretty]">
                {line}
              </span>
            </li>
          ))}
        </ol>

        <Reveal className="mt-7 text-center">
          <Link
            href="/book"
            className="group inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            לגלות מה יש בספר
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
              aria-hidden="true"
            />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
