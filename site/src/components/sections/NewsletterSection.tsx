import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export function NewsletterSection() {
  if (!siteConfig.features.newsletter) return null;

  return (
    <section
      id="waitlist"
      className="scroll-mt-24 py-5 sm:py-12"
      aria-labelledby="newsletter-heading"
    >
      <Container>
        {/* בלוק קומפקטי בעמודה אחת: כותרת קצרה, שורת הסבר, שדה + כפתור בשורה
            (WaitlistForm compact) והסכמה מתחת — בלי section גבוה. */}
        <div className="mx-auto max-w-2xl rounded-lg bg-secondary-muted px-6 py-5 text-center sm:px-10 sm:py-9">
          <span className="kicker justify-center">רשימת המתנה</span>
          <h2
            id="newsletter-heading"
            className="mt-2 font-serif text-[clamp(1.7rem,2.8vw,2.25rem)] font-semibold leading-[1.15] text-foreground"
          >
            קבלו עדכון כשהספר יוצא
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-foreground-muted">
            השאירו אימייל ותהיו מהראשונים לדעת כשהספר ייפתח לרכישה. בלי ספאם, אפשר להסיר בכל עת.
          </p>
          <div className="mx-auto mt-5 max-w-md text-start">
            <WaitlistForm source="homepage" compact />
          </div>
        </div>
      </Container>
    </section>
  );
}
