import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { testimonials } from "@/content/testimonials";

export function Testimonials() {
  if (testimonials.length === 0) {
    if (process.env.NODE_ENV === "production") return null;

    return (
      <Container className="py-10">
        <div className="rounded-lg border border-dashed border-border-strong bg-surface-muted p-6 text-center text-sm text-foreground-muted">
          אזור ההמלצות מוסתר ללקוחות מכיוון שעדיין אין המלצת קורא/ת מאושרת
          אחת לפחות. הוסיפו פריט למערך ב-
          <code className="mx-1 rounded bg-surface px-1.5 py-0.5">
            src/content/testimonials.ts
          </code>
          כדי להפעיל את האזור אוטומטית. (הודעה זו מוצגת רק בסביבת פיתוח.)
        </div>
      </Container>
    );
  }

  return (
    <section className="bg-surface-muted py-16 sm:py-24" aria-labelledby="testimonials-heading">
      <Container>
        <SectionHeading
          eyebrow="מהקוראים"
          title="מה קוראים אומרים"
          headingId="testimonials-heading"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
            >
              {testimonial.highlight ? (
                <p className="font-serif text-lg font-medium text-brand">
                  &ldquo;{testimonial.highlight}&rdquo;
                </p>
              ) : null}
              <blockquote className="text-base leading-relaxed text-foreground-muted">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-auto text-sm font-semibold text-foreground">
                {testimonial.name}
                {testimonial.role ? (
                  <span className="font-normal text-foreground-muted"> · {testimonial.role}</span>
                ) : null}
                {testimonial.readerType ? (
                  <span className="block font-normal text-foreground-muted">
                    {testimonial.readerType}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
