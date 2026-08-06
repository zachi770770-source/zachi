"use client";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import {
  hasEnoughTestimonials,
  personaFirstTestimonials,
} from "@/content/testimonials";
import { usePersonaOptional } from "@/components/persona/PersonaProvider";

/**
 * המלצות קוראים. הרכיב נגזר ישירות מהנתונים: הוא מרונדר רק כאשר יש לפחות
 * שלוש המלצות מאושרות (ראו testimonials.ts). אם אין שלוש, הפונקציה מחזירה
 * null ואין שום שטח ריק בעמוד. אין כאן טקסט דוגמה או המלצות מומצאות.
 *
 * מבנה מפולח: כשנבחרה פרסונה, ההמלצות המשויכות לה מוקדמות לראש (מיון יציב).
 * כל עוד אין המלצות אמיתיות מאושרות — הרכיב פשוט לא מרונדר.
 */
export function Testimonials() {
  const { personaId } = usePersonaOptional();
  if (!hasEnoughTestimonials()) return null;
  const items = personaFirstTestimonials(personaId);

  return (
    <section
      className="scroll-mt-20 bg-surface-muted py-16 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">קוראים מספרים</span>
          <h2 id="testimonials-heading" className="type-h2 mt-4">
            מה קוראים לקחו מהספר
          </h2>
        </Reveal>

        <Reveal className="mx-auto mt-14 grid max-w-5xl gap-x-12 gap-y-12 md:grid-cols-3">
          {items.map((t) => (
            <figure
              key={`${t.displayName}-${t.displayOrder}`}
              className="flex flex-col text-start"
            >
              <span
                aria-hidden="true"
                className="font-serif text-[3.25rem] leading-[0.6] text-brand/40"
              >
                ״
              </span>
              <blockquote className="mt-3 flex-1 font-serif text-[1.3rem] leading-[1.6] text-foreground">
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4">
                <span className="block font-semibold text-foreground">{t.displayName}</span>
                <span className="block text-[14px] text-foreground-muted">
                  {t.readerDescription}
                </span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
