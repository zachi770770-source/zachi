import Link from "next/link";
import { Compass, ArrowLeft, BookOpen } from "lucide-react";

import { compass } from "@/content/compass";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";

/**
 * סקשן ה-Signature של „המצפן” בעמוד הבית — הבידול המרכזי של האתר, ולכן
 * מקבל נוכחות משמעותית ומיקום מוקדם (מיד אחרי מרכז הספר). לא כרטיס רגיל
 * ולא בועת צ׳אט: פאנל עריכתי ממותג עם סמל מצפן כסימן מים, „מפרט” שימוש
 * ברור, ודוגמה ממחישה של שאלה וכיוון קצר (מסומנת „דוגמה”, לא תשובה חיה).
 * המענה האמיתי מתקבל ב-/compass דרך השרת; כאן תצוגה ומיצוב בלבד.
 */
export function CompassSignature() {
  const { signature } = compass;

  return (
    <section className="py-16 sm:py-20 lg:py-24" aria-labelledby="compass-signature-heading">
      <Container>
        <Reveal className="group relative overflow-hidden rounded-lg border border-border-strong bg-surface">
          {/* סימן מים: סמל המצפן — הזהות החזותית. מיקרו-אינטראקציה עדינה בריחוף. */}
          <Compass
            aria-hidden="true"
            className="pointer-events-none absolute -start-20 -top-16 h-72 w-72 text-brand/[0.05] transition-transform duration-700 ease-out group-hover:rotate-[18deg] motion-reduce:transition-none"
            strokeWidth={1}
          />

          <div className="relative grid gap-10 p-7 sm:p-11 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:p-14">
            {/* המסר + CTA */}
            <div>
              <span className="kicker">{signature.eyebrow}</span>
              <h2
                id="compass-signature-heading"
                className="mt-4 font-serif text-[clamp(1.85rem,3.2vw,2.55rem)] font-semibold leading-[1.12] text-balance text-foreground"
              >
                {signature.title}
              </h2>
              <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-foreground-muted">
                {signature.text}
              </p>

              <div className="mt-8">
                <Button asChild size="lg">
                  <Link href="/compass">
                    <Compass className="h-4 w-4" aria-hidden="true" />
                    {signature.cta}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* הדוגמה — „מפרט” עריכתי של שאלה → כיוון, לא בועת צ׳אט */}
            <figure className="relative rounded-lg border-s-2 border-brand bg-surface-muted/60 p-6 sm:p-7">
              <span className="inline-flex items-center rounded-full bg-brand-muted px-2.5 py-0.5 text-[12px] font-semibold tracking-wide text-brand-hover">
                {signature.example.label}
              </span>

              <p className="mt-4 font-quote text-[1.2rem] italic leading-snug text-foreground text-balance">
                „{signature.example.question}”
              </p>

              <div className="mt-5 flex gap-3 border-t border-border pt-5">
                <Compass
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <p className="text-[1.02rem] leading-relaxed text-foreground">
                  {signature.example.answer}
                </p>
              </div>

              <figcaption className="mt-5 flex items-center gap-2 text-[13px] font-medium text-foreground-muted">
                <BookOpen className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {signature.example.source}
              </figcaption>
            </figure>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
