import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { Hero } from "@/components/sections/Hero";
import { ThesisSection } from "@/components/sections/ThesisSection";
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

export const metadata: Metadata = {
  title: siteConfig.tagline,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <BookSchema />
      <ProductSchema />
      <Hero />
      <ThesisSection />
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
