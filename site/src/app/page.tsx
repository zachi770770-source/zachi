import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { ThesisSection } from "@/components/sections/ThesisSection";
import { StationsSection } from "@/components/sections/StationsSection";
import { StuckSelector } from "@/components/interactive/StuckSelector";
import { AudienceSection } from "@/components/sections/AudienceSection";
import { OutcomesSection } from "@/components/sections/OutcomesSection";
import { MethodSection } from "@/components/sections/MethodSection";
import { InsideBookSection } from "@/components/sections/InsideBookSection";
import { SampleSection } from "@/components/sections/SampleSection";
import { BehindSection } from "@/components/sections/BehindSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { FaqTeaser } from "@/components/sections/FaqTeaser";
import { PurchaseSection } from "@/components/sections/PurchaseSection";
import { BookSchema } from "@/components/schema/BookSchema";
import { ProductSchema } from "@/components/schema/ProductSchema";
import { WebSiteSchema } from "@/components/schema/WebSiteSchema";

export const metadata = pageMetadata({
  title: `${siteConfig.bookTitle} — ספר מעשי לדייטינג ולזוגיות | ${siteConfig.author.name}`,
  description: siteConfig.description,
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <BookSchema />
      <ProductSchema />
      <Hero />
      <ThesisSection />
      <StationsSection />
      <StuckSelector />
      <AudienceSection />
      <OutcomesSection />
      <MethodSection />
      <InsideBookSection />
      <SampleSection />
      <BehindSection />
      <NewsletterSection />
      <FaqTeaser />
      <PurchaseSection />
    </>
  );
}
