import type { Metadata } from "next";
import Link from "next/link";
import { FileDown } from "lucide-react";

import { siteConfig } from "@/config/site";
import { preview } from "@/content/book";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { PreviewGallery } from "@/components/preview/PreviewGallery";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "הצצה לספר",
  description: `תוכן העניינים וקטע לדוגמה מתוך הספר ${siteConfig.bookTitle}.`,
  alternates: { canonical: "/preview" },
};

export default function PreviewPage() {
  return (
    <Container className="py-10 sm:py-16">
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "הצצה לספר", path: "/preview" },
        ]}
      />

      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          {preview.title}
        </h1>
        <p className="mt-3 text-lg text-foreground-muted">
          {preview.description}
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-xl">
        <PreviewGallery />
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-2">
        <div>
          <h2 className="font-serif text-xl font-semibold">תוכן העניינים</h2>
          <ol className="mt-4 flex flex-col gap-2.5">
            {preview.tableOfContents.map((chapter, index) => (
              <li key={chapter} className="flex gap-3 text-base text-foreground-muted">
                <span className="font-serif text-brand">{index + 1}</span>
                {chapter}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold">
            {preview.excerptTitle}
          </h2>
          <blockquote className="prose-book mt-4 border-e-2 border-brand pe-4 text-lg italic leading-relaxed text-foreground-muted">
            &ldquo;{preview.excerpt}&rdquo;
          </blockquote>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-4 rounded-xl border border-border bg-surface-muted p-8 text-center">
        <p className="text-lg text-foreground-muted">
          קראתם עד כאן? זה בדיוק המקום להמשיך.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/#purchase">{preview.ctaLabel}</Link>
          </Button>
          {preview.sampleChapterPdfUrl ? (
            <Button asChild size="lg" variant="outline">
              <a href={preview.sampleChapterPdfUrl} target="_blank" rel="noreferrer">
                <FileDown className="h-4 w-4" aria-hidden="true" />
                הורדת פרק לדוגמה
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
