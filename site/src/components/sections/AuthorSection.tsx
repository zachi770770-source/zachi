import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { authorContent } from "@/content/author";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

export function AuthorSection() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="author-heading">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-start">
          <Image
            src={siteConfig.author.photo}
            alt={siteConfig.author.photoAlt}
            width={160}
            height={160}
            unoptimized
            className="h-32 w-32 shrink-0 rounded-full object-cover shadow-md sm:h-40 sm:w-40"
          />
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <h2
              id="author-heading"
              className="font-serif text-2xl font-semibold sm:text-3xl"
            >
              {authorContent.sectionTitle}
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-foreground-muted">
              {authorContent.homeTeaser}
            </p>
            <Button asChild variant="link">
              <Link href="/author">{authorContent.readMoreLabel}</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
