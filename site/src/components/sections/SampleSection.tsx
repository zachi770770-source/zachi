import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { preview } from "@/content/book";

/**
 * "טעימה מהספר" - קטע אמיתי מהמאגר, מעוצב כמו עמוד מספר ממש
 * (RTL, 20px, line-height 1.85). כפתור להמשך קריאה בעמוד ההצצה המלא.
 */
export function SampleSection() {
  return (
    <section
      id="sample"
      className="scroll-mt-20 bg-surface-muted py-24 sm:py-32"
      aria-labelledby="sample-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="kicker">
            טעימה מהספר
          </span>
          <h2 id="sample-heading" className="type-h2 mt-4">
            כמה שורות, כדי שתדעו לאן אתם נכנסים
          </h2>
        </Reveal>

        <Reveal className="mx-auto mt-12 max-w-2xl">
          <figure className="relative rounded-2xl border border-border bg-surface px-8 py-14 shadow-[0_30px_60px_-40px_rgba(34,38,43,0.35)] sm:px-16 sm:py-16">
            <span className="absolute right-8 top-8 text-[13px] font-medium uppercase tracking-[0.14em] text-foreground-muted sm:right-16">
              {preview.excerptTitle}
            </span>
            <blockquote className="prose-book type-quote mx-auto mt-8 text-foreground">
              <p>{preview.excerpt}</p>
            </blockquote>
            <figcaption className="mt-12 flex items-center justify-between border-t border-border pt-5 text-[14px] text-foreground-muted">
              <span>מתוך הספר מדייטים לאהבה</span>
              <span aria-hidden="true" className="text-brand/60">
                ❧
              </span>
            </figcaption>
          </figure>

          <div className="mt-8 text-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/preview">לקריאת טעימה מהספר</Link>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
