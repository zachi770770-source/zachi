import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ThesisMotifSection } from "@/components/sections/ThesisMotifSection";
import { BookPullQuote } from "@/components/sections/BookPullQuote";
import { StationsSection } from "@/components/sections/StationsSection";
import { StuckSelector } from "@/components/interactive/StuckSelector";
import { BookHubLink } from "@/components/sections/BookHubLink";
import { SampleSection } from "@/components/sections/SampleSection";
import { AuthorTeaser } from "@/components/sections/AuthorTeaser";
import { Testimonials } from "@/components/sections/Testimonials";
import { CompassSignature } from "@/components/compass/CompassSignature";
import { CompassLauncher } from "@/components/compass/CompassLauncher";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";
import { BookSchema } from "@/components/schema/BookSchema";
import { ProductSchema } from "@/components/schema/ProductSchema";
import { WebSiteSchema } from "@/components/schema/WebSiteSchema";

export const metadata = pageMetadata({
  title: `${siteConfig.bookTitle}: ספר מעשי לדייטינג ולזוגיות | ${siteConfig.author.name}`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

/**
 * עמוד הבית כשער ניווט קצר וניתן לסריקה מהירה. הוא מחזיק רק את מה שמכוון
 * את הקורא הלאה: Hero, שלוש התחנות, „איפה אתם נתקעים?”, טיזר קצר לספר,
 * טיזר קצר לטעימה, טיזר מחבר קצר מאוד (2 עד 3 שורות) ו-CTA לרשימת ההמתנה.
 * רכיב ההמלצות מרונדר רק כשיש שלוש המלצות מאושרות (אחרת null). כל הפירוט
 * המלא חי בדפים הייעודיים ולא משוכפל כאן: השיטה, מבנה הספר, הכלים, התוצאות
 * והמהדורות ב-/book; הטעימה המלאה ב-/preview; סיפור המחבר ב-/author.
 */
export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      <Hero />
      <TrustStrip />
      <ThesisMotifSection />
      <BookPullQuote />
      <StationsSection />
      <StuckSelector variant="compact" />
      <BookHubLink />
      <CompassSignature />
      <SampleSection />
      <AuthorTeaser />
      <Testimonials />
      <NewsletterSection />
      <CompassLauncher
        salesOpen={siteConfig.salesOpen}
        maxQuestionChars={COMPASS_LIMITS.maxQuestionChars}
      />
    </>
  );
}
