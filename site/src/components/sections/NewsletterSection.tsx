import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { BookCover } from "@/components/shared/BookCover";
import { closing } from "@/content/homeStory";

/**
 * סגירת עמוד הבית — ה-climax, לא „כרטיס CTA ירוק”. הבמה חוזרת: שדה-Ink חמים
 * (bookend מול ה-Hero), הכריכה *חוזרת* כאובייקט, וכותרת גדולה מזמינה את הצעד
 * הטבעי — הספר. אמזון הוא ערוץ הרכישה היחיד: אין רשימת המתנה, אין checkout
 * מקומי, אין דחיפות/ספירה/„מלאי אחרון”.
 *
 * שתי דרגות-מוכנות (לא CTA יחיד): כפתור-רכישה למי שכבר שוכנע, וקישור-טעימה שקט
 * למי שלא. הקופי והקישורים (כולל source האנליטיקה) לא השתנו.
 */
export function NewsletterSection() {
  return (
    <section
      id="get-the-book"
      className="sig-close scroll-mt-24"
      aria-labelledby="get-the-book-heading"
    >
      <div className="sig-close__bg" aria-hidden="true" />
      <Container className="sig-close__container">
        <div className="sig-close__inner reveal">
          {/* הכריכה חוזרת — אובייקט-סיום, עם זוהר ועומק. דקורטיבי. */}
          <div className="sig-close__cover" aria-hidden="true">
            <span className="sig-close__glow" />
            <BookCover className="w-full" />
          </div>

          <div className="sig-close__copy">
            <h2 id="get-the-book-heading" className="sig-close__title">
              {closing.title}
            </h2>
            <p className="sig-close__avail">
              {siteConfig.amazon.availableLabel}. קריאה מיידית לאחר הרכישה,
              באפליקציית Kindle או בכל מכשיר תואם.
            </p>
            <div className="sig-close__cta">
              <AmazonBuyLink source="home" className="sig-close__buy">
                {siteConfig.amazon.buyLabel}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </AmazonBuyLink>
            </div>
            <p className="sig-close__secondary">
              {closing.secondaryPrompt}{" "}
              <Link href="/preview" className="sig-close__secondary-link">
                {closing.secondaryLabel}
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
