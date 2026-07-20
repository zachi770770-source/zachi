import { Sparkles } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export function NewsletterSection() {
  if (!siteConfig.features.newsletter) return null;

  return (
    <section className="py-16 sm:py-20" aria-labelledby="newsletter-heading">
      <Container>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-xl border border-border bg-surface-muted p-6 text-center sm:p-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="newsletter-heading" className="font-serif text-2xl font-semibold">
            טעימה חינמית: בדיקת השקט
          </h2>
          <p className="max-w-md text-base leading-relaxed text-foreground-muted">
            כלי קצר שיעזור לכם להבין - האם אין קשר, או שפשוט אין דרמה?
            נשלח אליכם במייל, ללא עלות.
          </p>
          <div className="w-full max-w-sm text-start">
            <NewsletterForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
