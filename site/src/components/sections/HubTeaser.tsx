import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";

/**
 * „טעימת שער” מצומצמת בעמוד הבית: כותרת, משפט אחד וקישור לעמוד המלא. משמש
 * להעברת סקשנים כבדים (כלים, הצצה) לדפים הייעודיים שלהם — הבית מתקצר ונשאר שער
 * סריקה, בלי להתרוקן. תצוגה בלבד; חשיפת Reveal עדינה כמו שאר הסקשנים.
 */
export function HubTeaser({
  id,
  kicker,
  heading,
  text,
  href,
  linkLabel,
}: {
  id: string;
  kicker: string;
  heading: string;
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <section id={id} className="py-14 sm:py-16" aria-labelledby={`${id}-heading`}>
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{kicker}</span>
          <h2 id={`${id}-heading`} className="type-h2 mt-4">
            {heading}
          </h2>
          <p className="type-lead mt-4 text-foreground-muted [text-wrap:pretty]">{text}</p>
          <Link
            href={href}
            className="group mt-6 inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {linkLabel}
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
