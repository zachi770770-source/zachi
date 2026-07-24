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
  title: "על המחבר",
  description: `היכרות עם ${siteConfig.author.name}, מחבר/ת הספר ${siteConfig.bookTitle}.`,
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
          className="h-40 w-40 rounded-full object-cover shadow-md"
        />
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            {siteConfig.author.name}
          </h1>
          <p className="mt-2 text-lg text-foreground-muted">
            {authorContent.sectionTitle}
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
