import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";

/**
 * סגירת עמוד הבית — נקודת ה-High Intent האחרונה. אמזון הוא ערוץ הרכישה היחיד:
 * מסר פשוט וברור („הספר המלא זמין עכשיו באמזון” → „לרכישה באמזון”). אין רשימת
 * המתנה, אין „מהדורה ישירה · בקרוב”, אין איסוף מיילים ואין checkout מקומי.
 */
export function NewsletterSection() {
  return (
    <section
      id="get-the-book"
      className="scroll-mt-24 py-6 sm:py-12"
      aria-labelledby="get-the-book-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl rounded-lg bg-secondary-muted px-6 py-8 text-center sm:px-10 sm:py-10">
          <span className="kicker justify-center">
            {siteConfig.amazon.availableLabel}
          </span>
          <h2
            id="get-the-book-heading"
            className="mt-1.5 font-serif text-[clamp(1.6rem,2.8vw,2.25rem)] font-semibold leading-[1.15] text-foreground sm:mt-2"
          >
            הספר המלא זמין עכשיו באמזון
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-foreground-muted">
            {siteConfig.amazon.editionLabel} — קריאה מיידית לאחר הרכישה,
            באפליקציית Kindle או בכל מכשיר תואם.
          </p>
          <div className="mt-5 flex justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <AmazonBuyLink source="home">
                {siteConfig.amazon.buyLabel}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </AmazonBuyLink>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
