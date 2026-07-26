import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ThesisSection } from "@/components/sections/ThesisSection";
import { StationsSection } from "@/components/sections/StationsSection";
import { BookHubLink } from "@/components/sections/BookHubLink";
import { StuckSelector } from "@/components/interactive/StuckSelector";
import { SampleSection } from "@/components/sections/SampleSection";
import { CompassCard } from "@/components/compass/CompassCard";
import { AuthorTeaser } from "@/components/sections/AuthorTeaser";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
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
 * עמוד הבית כשער מרכזי: ניתן לסריקה מהירה, עם מסלול ברור לדפים הייעודיים.
 * רק Hero, תקציר הרעיון, שלוש התחנות, „איפה אתם נתקעים?” (גרסה קצרה),
 * טעימה קצרה, טיזר מחבר ורשימת המתנה. הפירוט המלא (שיטה, מבנה, כלים,
 * תוצאות, מהדורות) עבר ל-/book; הסיפור המלא ל-/author; ה-FAQ ל-/faq.
 */
export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      <Hero />
      <ThesisSection />
      <StationsSection />
      <BookHubLink />
      <StuckSelector variant="compact" />
      <SampleSection />
      <CompassCard />
      <AuthorTeaser />
      <NewsletterSection />
    </>
  );
}
