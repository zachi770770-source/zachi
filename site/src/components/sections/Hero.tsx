import Link from "next/link";

import { hero } from "@/content/book";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { TrustBar } from "@/components/sections/TrustBar";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* מוטיב עומק עדין: שני קווים שמתכנסים — מחיפוש לחיבור */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted/70 via-background to-background" />
        <svg
          className="absolute -top-24 left-1/2 h-[820px] w-[820px] -translate-x-1/3 opacity-[0.5]"
          viewBox="0 0 600 600"
          fill="none"
        >
          <path
            d="M40 120 C 260 180, 300 300, 560 300"
            stroke="var(--color-border-strong)"
            strokeWidth="1.5"
          />
          <path
            d="M40 480 C 260 420, 300 300, 560 300"
            stroke="var(--color-border-strong)"
            strokeWidth="1.5"
          />
          <circle cx="560" cy="300" r="5" fill="var(--color-brand)" />
        </svg>
      </div>

      <Container className="flex min-h-[600px] items-center py-16 sm:py-20 lg:min-h-[680px]">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
          {/* מסר (ימין ב-RTL; במובייל ראשון - מסר ואז CTA ואז עטיפה) */}
          <div className="order-1 flex max-w-[650px] flex-col items-start">
            <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-hover">
              {hero.eyebrow}
            </span>
            <h1 className="type-h1 mt-5">
              {hero.headlineTop}
              <br />
              {hero.headlineBottom}
            </h1>
            <p className="type-quote mt-6 text-[clamp(1.35rem,2.2vw,1.75rem)] leading-snug text-brand-hover">
              {hero.tagline}
            </p>
            <p className="type-lead mt-6 max-w-[46ch] text-foreground-muted">
              {hero.description}
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <Link href="/#purchase">{hero.primaryCta}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#sample">{hero.secondaryCta}</Link>
              </Button>
            </div>

            <TrustBar className="mt-9" />
          </div>

          {/* עטיפה (שמאל ב-RTL; במובייל אחרונה, לאחר המסר וה-CTA), לא נחתכת */}
          <div className="order-2 flex justify-center lg:justify-end">
            <BookCover priority className="max-w-[280px] sm:max-w-[320px] lg:max-w-[360px]" />
          </div>
        </div>
      </Container>
    </section>
  );
}
