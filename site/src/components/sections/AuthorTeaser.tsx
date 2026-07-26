import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { authorContent } from "@/content/author";

/**
 * טיזר מחבר קצר לעמוד הבית. פסקה אחת מזמינה + קישור לעמוד /author המלא.
 * הסיפור המלא (fullBio, שמע ותמלול) חי בעמוד המחבר בלבד — כאן רק פתיח,
 * ללא כפילות. מבוסס על שפת העיצוב של „מאחורי הספר”.
 */
export function AuthorTeaser() {
  return (
    <section
      id="author-teaser"
      className="scroll-mt-20 py-24 sm:py-32"
      aria-labelledby="author-teaser-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-3xl">
          <span className="kicker">על המחבר</span>
          <h2 id="author-teaser-heading" className="type-h2 mt-4">
            {authorContent.sectionTitle}
          </h2>
          <p className="mt-8 border-r-2 border-brand/30 pr-6 text-[19px] leading-[1.75] text-foreground-muted sm:pr-8">
            {authorContent.homeTeaser}
          </p>
          <Link
            href="/author"
            className="group mt-8 inline-flex items-center gap-2 text-[17px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {authorContent.readMoreLabel}
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
