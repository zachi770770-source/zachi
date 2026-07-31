import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { ThesisMotifSection } from "@/components/sections/ThesisMotifSection";
import { StationsSection } from "@/components/sections/StationsSection";
import { BookHubLink } from "@/components/sections/BookHubLink";
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
 * עמוד הבית כשער השכנוע הראשי: כל סקשן = תפקיד יחיד במסע ההמרה, בלי כפילות.
 * Hero (מה/למי/הבטחה/פעולה) → פס עובדות → התזה (עוגן) → תחנת הקשר (זיהוי
 * + ניתוב) → מה נותן הספר (ערך מעשי מזוקק) → טעימת שיטה (המצפן) → מחבר קצר
 * → החלטת המרה סוגרת (טעימה חינם או רשימת המתנה). כל העומק חי בדפים
 * הייעודיים ולא משוכפל כאן: /book, /preview, /compass, /author, /faq
 * ודפי התחנות. רכיב ההמלצות מרונדר רק כשיש שלוש המלצות מאושרות (אחרת null).
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
      <StationsSection />
      <BookHubLink />
      <CompassSignature />
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
