import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { authorContent } from "@/content/author";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { PersonSchema } from "@/components/schema/PersonSchema";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "על הספר",
  description: `למה נכתב הספר ${siteConfig.bookTitle}, למי הוא מיועד ומה תיקחו ממנו.`,
  alternates: { canonical: "/author" },
};

export default function AuthorPage() {
  return (
    <Container className="py-10 sm:py-16">
      <PersonSchema />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "על המחבר", path: "/author" },
        ]}
      />

      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <Image
          src={siteConfig.author.photo}
          alt={siteConfig.author.photoAlt}
          width={200}
          height={200}
          unoptimized
          className="h-40 w-40 rounded-full object-cover ring-1 ring-border-strong"
        />
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-hover">
            {siteConfig.author.name} — מחבר {siteConfig.bookTitle}
          </span>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            {authorContent.sectionTitle}
          </h1>
          <p className="font-serif text-lg italic text-foreground-muted">
            {siteConfig.tagline}
          </p>
        </div>
      </div>

      <div className="prose-book mx-auto mt-10 flex flex-col gap-5 text-start">
        {authorContent.fullBio.map((paragraph, index) => (
          <p key={index} className="text-lg leading-relaxed text-foreground-muted">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-2xl justify-center">
        <Button asChild size="lg">
          <Link href="/#purchase">לרכישת הספר</Link>
        </Button>
      </div>
    </Container>
  );
}
