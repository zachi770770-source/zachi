import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { Button } from "@/components/ui/button";
import { authorContent } from "@/content/author";

const PHOTO_SIZES = "(max-width: 1024px) 240px, 260px";

/**
 * טיזר מחבר בעמוד הבית — נוכחות אנושית ברורה: תמונה אמיתית של צחי חן,
 * הסבר קצר וכפתור בולט ל-/author. הסיפור המלא (fullBio, שמע, תמלול) חי
 * בעמוד המחבר בלבד. המחבר מוצג כמי שכתב מתוך התבוננות — לא כמטפל/מומחה.
 */
export function AuthorTeaser() {
  return (
    <section
      id="author-teaser"
      className="scroll-mt-20 py-20 sm:py-24"
      aria-labelledby="author-teaser-heading"
    >
      <Container>
        <Reveal className="mx-auto grid max-w-4xl items-center gap-10 border-y border-border py-10 sm:gap-14 sm:py-14 lg:grid-cols-[minmax(0,240px)_1fr] lg:gap-16">
          {/* תמונת המחבר האמיתית (הילת Sage עדינה; ללא stock/AI) */}
          <div className="order-1 mx-auto w-full max-w-[240px] lg:mx-0">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-2.5 -z-10 rounded-[1.5rem] bg-secondary/[0.08]"
              />
              <picture>
                <source
                  type="image/avif"
                  sizes={PHOTO_SIZES}
                  srcSet="/images/author/zachi-chen-640.avif 640w, /images/author/zachi-chen-960.avif 960w"
                />
                <source
                  type="image/webp"
                  sizes={PHOTO_SIZES}
                  srcSet="/images/author/zachi-chen-640.webp 640w, /images/author/zachi-chen-960.webp 960w"
                />
                <img
                  src="/images/author/zachi-chen-960.jpg"
                  width={1600}
                  height={2000}
                  alt={siteConfig.author.photoAlt}
                  loading="lazy"
                  decoding="async"
                  className="block w-full rounded-2xl object-cover shadow-[0_28px_54px_-30px_rgba(43,36,31,0.5)] ring-1 ring-border-strong/60"
                />
              </picture>
            </div>
          </div>

          {/* טקסט + כפתור בולט */}
          <div className="order-2 flex flex-col items-start text-start">
            <span className="kicker">על המחבר</span>
            <h2
              id="author-teaser-heading"
              className="mt-4 font-serif text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.2] text-foreground"
            >
              {authorContent.sectionTitle}
            </h2>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-foreground-muted">
              {authorContent.homeTeaser}
            </p>
            <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button asChild variant="outline" size="lg">
                <Link href="/author">
                  עוד על המחבר
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Link
                href="/preview"
                className="group inline-flex min-h-[44px] items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                לקריאת טעימה מהספר
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
