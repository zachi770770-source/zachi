import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { closing } from "@/content/homeStory";

/**
 * סגירת עמוד הבית — נקודת ה-High Intent האחרונה. אמזון הוא ערוץ הרכישה היחיד:
 * אין רשימת המתנה, אין „מהדורה ישירה · בקרוב”, אין איסוף מיילים ואין checkout
 * מקומי — וגם אין דחיפות, ספירה לאחור או „מלאי אחרון”.
 *
 * היררכיית הפעולה כאן היא שתי דרגות של מוכנות, לא CTA אחד: הכפתור הראשי לרכישה
 * למי שכבר שוכנע, וקישור שקט לטעימה למי שלא — כדי שסוף העמוד לא יהיה קיר יחיד
 * שמי שאינו מוכן פשוט נעצר בו.
 */
export function NewsletterSection() {
  return (
    <section
      id="get-the-book"
      className="scroll-mt-24 py-6 sm:py-12"
      aria-labelledby="get-the-book-heading"
    >
      <Container>
        <div className="reveal mx-auto max-w-3xl rounded-2xl bg-secondary-muted px-6 py-9 text-center sm:px-12 sm:py-12">
          <span className="kicker justify-center">
            {siteConfig.amazon.availableLabel}
          </span>
          <h2
            id="get-the-book-heading"
            className="mx-auto mt-2 max-w-[24ch] font-serif text-[clamp(1.6rem,3vw,2.5rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
          >
            {closing.title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-foreground-muted">
            {siteConfig.amazon.editionLabel}: קריאה מיידית לאחר הרכישה,
            באפליקציית Kindle או בכל מכשיר תואם.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <AmazonBuyLink source="home">
                {siteConfig.amazon.buyLabel}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </AmazonBuyLink>
            </Button>
          </div>
          {/* הדרגה השנייה — סיכון אפס, בלי להתחרות ויזואלית בכפתור הרכישה. */}
          <p className="mt-4 text-[14px] leading-relaxed text-foreground-muted">
            {closing.secondaryPrompt}{" "}
            <Link
              href="/preview"
              className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {closing.secondaryLabel}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
