import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { Hero } from "@/components/sections/Hero";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { BigIdeaSection } from "@/components/sections/BigIdeaSection";
import { MethodSection } from "@/components/sections/MethodSection";
import { OutcomesSection } from "@/components/sections/OutcomesSection";
import { ToolsSection } from "@/components/sections/ToolsSection";
import { BookPreviewTeaser } from "@/components/sections/BookPreviewTeaser";
import { PurchaseSection } from "@/components/sections/PurchaseSection";
import { BonusSection } from "@/components/sections/BonusSection";
import { Testimonials } from "@/components/sections/Testimonials";
import { AuthorSection } from "@/components/sections/AuthorSection";
import { FaqTeaser } from "@/components/sections/FaqTeaser";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { ClosingSection } from "@/components/sections/ClosingSection";
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
      <ProblemSection />
      <BigIdeaSection />
      <MethodSection />
      <OutcomesSection />
      <ToolsSection />
      <BookPreviewTeaser />
      <PurchaseSection />
      <BonusSection />
      <Testimonials />
      <AuthorSection />
      <FaqTeaser />
      <NewsletterSection />
      <ClosingSection />
    </>
  );
}
