import Link from "next/link";
import { Check, Clock3 } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { TrustBar } from "@/components/sections/TrustBar";

export function Hero() {
  const digitalPrice = siteConfig.products.formats.digital.price;

  return (
    <section className="relative overflow-hidden">
      {/* רקע אווירה מלא-רוחב: מוטיב "מחיפוש לבנייה" + זוהר רך מאחורי העטיפה */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted via-background to-background" />
        <div className="absolute -top-32 left-[14%] h-[560px] w-[560px] rounded-full bg-brand/[0.08] blur-3xl" />
        <svg
          className="absolute inset-x-0 top-0 h-full w-full opacity-[0.55]"
          viewBox="0 0 1440 760"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <path
            d="M-40 150 C 480 250, 620 470, 1480 430"
            stroke="var(--color-border-strong)"
            strokeWidth="1.5"
          />
          <path
            d="M-40 610 C 480 520, 620 470, 1480 430"
            stroke="var(--color-border-strong)"
            strokeWidth="1.5"
          />
          <circle cx="1180" cy="440" r="5" fill="var(--color-brand)" />
        </svg>
      </div>

      <Container className="flex min-h-[660px] items-center py-16 sm:py-20 lg:min-h-[760px] lg:py-24">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.02fr_minmax(0,30rem)] lg:gap-16">
          {/* מסר (ימין ב-RTL) */}
          <div className="order-1 flex max-w-[640px] flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/70 px-3.5 py-1.5 text-[13px] font-semibold text-brand-hover">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
              {hero.eyebrow}
            </span>

            <h1 className="type-h1 mt-6 text-[clamp(2.875rem,5.6vw,5.25rem)]">
              {hero.headlineTop}
              <br />
              {hero.headlineBottom}
            </h1>

            <p className="type-quote mt-6 text-[clamp(1.4rem,2.3vw,1.9rem)] leading-snug text-brand-hover">
              {hero.tagline}
            </p>
            <p className="type-lead mt-6 max-w-[47ch] text-foreground-muted">
              {hero.description}
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg" className="h-14 px-8 text-base">
                <Link href="/#purchase">
                  {hero.primaryCta}
                  {digitalPrice != null ? ` · ${formatPrice(digitalPrice)}` : ""}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base">
                <Link href="/#sample">{hero.secondaryCta}</Link>
              </Button>
            </div>

            {/* שתי מהדורות — ברור מיד */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-3 py-1.5 text-[13px] font-semibold text-brand-hover">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                מהדורה דיגיטלית — זמינה עכשיו
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-3 py-1.5 text-[13px] font-medium text-foreground-muted">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                מהדורה מודפסת — בקרוב
              </span>
            </div>

            <TrustBar className="mt-8" />
          </div>

          {/* עטיפה (שמאל ב-RTL), על "במה" רכה שנותנת לה נוכחות ועומק */}
          <div className="order-2 flex justify-center lg:justify-end">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-x-6 -bottom-6 top-10 -z-10 rounded-[2rem] bg-gradient-to-b from-brand/[0.10] to-secondary/[0.08] blur-2xl"
              />
              <BookCover
                priority
                className="w-[240px] sm:w-[300px] lg:w-[380px]"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
