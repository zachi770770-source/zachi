import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";

export function NewsletterSection() {
  if (!siteConfig.features.newsletter) return null;

  return (
    <section
      id="waitlist"
      className="scroll-mt-24 py-4 sm:py-10"
      aria-labelledby="newsletter-heading"
    >
      <Container>
        {/* הספר כבר זמין באמזון — הרשימה נשמרת רק למהדורה הישירה/המודפסת העתידית
            באתר, ואינה חוסמת מי שרוצה לקנות עכשיו. */}
        <div className="mx-auto max-w-2xl rounded-lg bg-secondary-muted px-6 py-4 text-center sm:px-10 sm:py-9">
          <span className="kicker justify-center">מהדורה ישירה · בקרוב</span>
          <h2
            id="newsletter-heading"
            className="mt-1.5 font-serif text-[clamp(1.6rem,2.8vw,2.25rem)] font-semibold leading-[1.15] text-foreground sm:mt-2"
          >
            רוצים עדכון כשהמהדורה הישירה באתר תיפתח?
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-[15px] leading-snug text-foreground-muted sm:mt-2 sm:leading-relaxed">
            הספר כבר זמין עכשיו במהדורת Kindle באמזון. אם תעדיפו לחכות למהדורה
            הישירה באתר — השאירו אימייל ונעדכן אתכם. בלי ספאם.
          </p>
          <div className="mt-3 flex justify-center">
            <AmazonBuyLink
              source="home"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              לא רוצים לחכות? הספר זמין עכשיו באמזון
              <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </AmazonBuyLink>
          </div>
          <div className="mx-auto mt-4 max-w-md text-start">
            <WaitlistForm source="homepage" compact />
          </div>
        </div>
      </Container>
    </section>
  );
}
