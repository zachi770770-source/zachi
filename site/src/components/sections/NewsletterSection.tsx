import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export function NewsletterSection() {
  if (!siteConfig.features.newsletter) return null;

  return (
    <section className="py-6 sm:py-10" aria-labelledby="newsletter-heading">
      <Container>
        <div className="mx-auto grid max-w-4xl items-center gap-8 rounded-3xl border border-border bg-surface px-8 py-12 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] sm:px-12">
          <div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-hover">
              טעימה חינמית
            </span>
            <h2
              id="newsletter-heading"
              className="mt-3 text-[clamp(1.6rem,2.6vw,2.1rem)] font-bold leading-tight"
            >
              בדיקת השקט — כלי קצר, חינם במייל
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-foreground-muted">
              כלי קצר שיעזור לכם להבין: האם אין קשר, או שפשוט אין דרמה?
            </p>
          </div>
          <div className="w-full text-start">
            <NewsletterForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
