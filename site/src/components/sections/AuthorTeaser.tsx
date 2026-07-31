import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { authorContent } from "@/content/author";

/**
 * טיזר מחבר קצר מאוד לשער הבית: שתיים עד שלוש שורות וקישור ברור ל-/author.
 * הסיפור המלא (fullBio, שמע ותמלול) חי בעמוד המחבר בלבד, ללא כפילות כאן.
 */
export function AuthorTeaser() {
  return (
    <section
      id="author-teaser"
      className="scroll-mt-20 py-16 sm:py-24"
      aria-labelledby="author-teaser-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          {/* תמונת מחבר אמיתית — אנושיות ואמון, קומפקטית. הסיפור המלא ב-/author. */}
          <Image
            src={siteConfig.author.photo}
            alt={siteConfig.author.photoAlt}
            width={96}
            height={96}
            sizes="96px"
            className="mx-auto mb-6 h-24 w-24 rounded-full object-cover shadow-sm ring-1 ring-border"
          />
          <span className="kicker justify-center">על המחבר</span>
          <h2
            id="author-teaser-heading"
            className="mt-4 font-serif text-xl font-semibold text-foreground sm:text-2xl"
          >
            {authorContent.sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-[54ch] text-[17px] leading-relaxed text-foreground-muted">
            {authorContent.homeTeaser}
          </p>
          <Link
            href="/author"
            className="group mt-6 inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            עוד על המחבר
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
