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
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 rounded-2xl border border-border bg-surface-muted p-8 text-center sm:flex-row sm:items-center sm:gap-10 sm:p-12 sm:text-start">
          <Image
            src={siteConfig.author.photo}
            alt={siteConfig.author.photoAlt}
            width={176}
            height={176}
            unoptimized
            className="h-36 w-36 shrink-0 rounded-full object-cover ring-1 ring-border-strong sm:h-44 sm:w-44"
          />
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-hover">
              על המחבר/ת
            </span>
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
