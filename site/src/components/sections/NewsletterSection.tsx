import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export function NewsletterSection() {
  if (!siteConfig.features.newsletter) return null;

  return (
    <section
      id="waitlist"
      className="scroll-mt-24 py-6 sm:py-10"
      aria-labelledby="newsletter-heading"
    >
      <Container>
        <div className="mx-auto grid max-w-4xl items-center gap-8 rounded-3xl border border-border bg-surface px-8 py-12 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] sm:px-12">
          <div>
            <span className="kicker">רשימת המתנה</span>
            <h2
              id="newsletter-heading"
              className="mt-3 text-[clamp(1.6rem,2.6vw,2.1rem)] font-bold leading-tight"
            >
              קבלו עדכון כשהספר יוצא
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-foreground-muted">
              השאירו אימייל ונעדכן אתכם ברגע שהמהדורה הדיגיטלית תיפתח לרכישה. בלי ספאם, ואפשר להסיר את ההרשמה בכל עת.
            </p>
          </div>
          <div className="w-full text-start">
            <WaitlistForm source="homepage" />
          </div>
        </div>
      </Container>
    </section>
  );
}
