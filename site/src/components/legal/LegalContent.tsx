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
