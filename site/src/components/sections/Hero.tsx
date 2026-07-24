import Link from "next/link";
import { Check, Clock3 } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { SearchToBuild } from "@/components/shared/SearchToBuild";
import { TrustBar } from "@/components/sections/TrustBar";

export function Hero() {
  const digitalPrice = siteConfig.products.formats.digital.price;

  return (
    <section className="relative overflow-hidden">
      {/* אווירה: שכבת גרעין + זוהר חם מאחורי העטיפה + מוטיב מלא-רוחב */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted via-background to-background" />
        <div className="absolute -top-40 start-[6%] h-[620px] w-[620px] rounded-full bg-brand/[0.09] blur-[110px]" />
        <div className="absolute bottom-0 end-[10%] h-[420px] w-[420px] rounded-full bg-secondary/[0.07] blur-[100px]" />
        <div className="grain-layer absolute inset-0 opacity-[0.035] mix-blend-multiply" />
      </div>

      <Container className="flex min-h-[640px] flex-col justify-center py-16 sm:py-20 lg:min-h-[780px] lg:py-24">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.05fr_minmax(0,29rem)] lg:gap-16">
          {/* מסר (ימין ב-RTL) */}
          <div className="order-1 flex max-w-[660px] flex-col items-start">
            <span className="kicker">{hero.eyebrow}</span>

            <h1 className="type-display mt-6 text-foreground">
              {hero.headlineTop}
              <br />
              <span className="text-brand-hover">{hero.headlineBottom}</span>
            </h1>

            {/* המוטיב החתום — בדיוק במקום שבו המילים עוברות מחיפוש לבנייה */}
            <SearchToBuild className="mt-7 h-9 w-[260px] max-w-full text-foreground/70" />

            <p className="type-lead mt-7 max-w-[48ch] text-foreground-muted">
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

          {/* העטיפה כאובייקט מואר: זוהר, במה וצל קרקע אליפטי */}
          <div className="order-2 flex justify-center lg:justify-end">
            <div className="relative flex w-[240px] items-end justify-center sm:w-[300px] lg:w-[380px]">
              <div
                aria-hidden="true"
                className="absolute -inset-x-10 -top-10 bottom-6 -z-10 rounded-[50%] bg-[radial-gradient(closest-side,rgba(166,92,62,0.18),transparent_72%)]"
              />
              <BookCover priority className="w-full" />
              {/* צל קרקע רך שנותן לספר לעמוד על משטח */}
              <div
                aria-hidden="true"
                className="absolute -bottom-4 h-8 w-[78%] rounded-[50%] bg-foreground/25 blur-2xl"
              />
            </div>
          </div>
        </div>
      </Container>

      {/* קו סיום עדין שמחבר אל הסקשן הבא */}
      <div
        aria-hidden="true"
        className="mx-auto h-px w-full max-w-[77.5rem] bg-gradient-to-l from-transparent via-border-strong to-transparent"
      />
    </section>
  );
}
