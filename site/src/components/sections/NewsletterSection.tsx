import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export function NewsletterSection() {
  if (!siteConfig.features.newsletter) return null;

  return (
    <section
      id="waitlist"
      className="scroll-mt-24 py-14 sm:py-20"
      aria-labelledby="newsletter-heading"
    >
      <Container>
        <Reveal className="mx-auto grid max-w-4xl items-center gap-10 rounded-lg bg-secondary-muted px-7 py-11 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] sm:px-12 sm:py-14">
          <div>
            {/* הד סוגר למוטיב „מנקודות למבנה”: מבנה יציב ובנוי במלואו */}
            <span aria-hidden="true" className="mb-5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="route-line h-px w-7 bg-border-strong" />
              <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
              <span className="route-line h-px w-7 bg-border-strong" />
              <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
            </span>
            <span className="kicker">רשימת המתנה</span>
            <h2
              id="newsletter-heading"
              className="mt-3 font-serif text-[clamp(1.7rem,2.8vw,2.25rem)] font-semibold leading-[1.15] text-foreground"
            >
              קבלו עדכון כשהספר יוצא
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-foreground-muted">
              השאירו אימייל ונעדכן אתכם כשהמהדורה הדיגיטלית תיפתח לרכישה. בלי ספאם, אפשר להסיר בכל עת.
            </p>
            <p className="mt-4 text-[15px] text-foreground-muted">
              לא רוצים לחכות?{" "}
              <Link
                href="/preview"
                className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                קראו עכשיו טעימה חינם מהספר
              </Link>
              .
            </p>
          </div>
          <div className="w-full text-start">
            <WaitlistForm source="homepage" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
