import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { preview } from "@/content/book";

export function BookPreviewTeaser() {
  return (
    <section className="bg-surface-muted py-16 sm:py-24" aria-labelledby="preview-heading">
      <Container>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-xl border border-border bg-surface px-6 py-12 text-center sm:px-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </span>
          <SectionHeading
            title={preview.title}
            description={preview.description}
            headingId="preview-heading"
          />
          <blockquote className="prose-book mx-auto border-e-2 border-brand pe-4 text-lg italic leading-relaxed text-foreground-muted">
            &ldquo;{preview.excerpt}&rdquo;
          </blockquote>
          <Button asChild size="lg">
            <Link href="/preview">לקריאת טעימה מהספר</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
