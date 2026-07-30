import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";

type LegalSection = { heading: string; body: string };

export function LegalContent({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  // כל עוד פרטי העוסק/החברה, הכתובת ואמצעי הקשר הם PLACEHOLDER — המסמך אינו
  // מוצג כשלם, אלא כגרסת מסגרת. אין להמציא פרטים אלה.
  const legalDetailsPending =
    siteConfig.business.legalName.includes("PLACEHOLDER") ||
    siteConfig.business.address.includes("PLACEHOLDER") ||
    siteConfig.contact.email.includes("PLACEHOLDER") ||
    siteConfig.contact.email.includes("example.com");

  return (
    <Container className="py-10 sm:py-16">
      <div className="prose-book mx-auto">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">{updatedAt}</p>

        {!siteConfig.salesOpen ? (
          <p className="mt-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-foreground-muted">
            האתר נמצא כעת בשלב טרום-השקה, והמכירה טרם נפתחה. הסעיפים העוסקים
            ברכישה, בתשלום, במסירה, במשלוח ובביטול יחולו החל ממועד פתיחת המכירה.
          </p>
        ) : null}

        {legalDetailsPending ? (
          <p className="mt-4 rounded-lg border border-border border-s-2 border-s-brand bg-surface-muted px-4 py-3 text-sm leading-relaxed text-foreground">
            זוהי גרסת מסגרת של המסמך. פרטי העוסק/החברה, הכתובת הרשומה ואמצעי הקשר
            הרשמיים יתווספו ויאושרו לפני ההשקה. אין לראות במסמך זה ייעוץ משפטי או
            מסמך סופי.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl font-semibold">
                {section.heading}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-foreground-muted">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
