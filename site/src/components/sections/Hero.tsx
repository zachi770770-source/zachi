import Link from "next/link";
import { ArrowLeft, ArrowDown } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { SearchToBuild } from "@/components/shared/SearchToBuild";

/**
 * Hero — כמעט מסך מלא (100svh). כותרת שער רחבה, "קו הבנייה" (SearchToBuild)
 * כחתימה, ומתחת: בלוק מוצר (עטיפה + 98 ₪ + CTA) לצד טקסט הסבר. במובייל בלוק
 * המוצר מופיע ראשון, כך שבמסך הראשון רואים כותרת, ספר, 98 ₪ ו-CTA.
 */
export function Hero() {
  const digitalPrice = siteConfig.products.formats.digital.price;
  const priceLabel = digitalPrice != null ? formatPrice(digitalPrice) : "";

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted/50 to-background" />
        <div className="absolute -top-40 start-[8%] h-[560px] w-[560px] rounded-full bg-brand/[0.07] blur-[120px]" />
      </div>

      <Container className="flex flex-1 flex-col">
        {/* קו מסטהד */}
        <div className="flex items-center justify-between gap-4 border-b border-foreground/12 py-4">
          <span className="kicker">{hero.eyebrow}</span>
          <span className="hidden text-[12px] font-medium uppercase tracking-[0.16em] text-foreground-muted sm:block">
            מהדורה דיגיטלית · 2026
          </span>
        </div>

        {/* כותרת שער + קו הבנייה */}
        <div className="pt-8 sm:pt-10">
          <h1 className="type-display text-foreground">
            להפסיק לחפש.
            <br />
            <span className="text-brand-hover">להתחיל לבנות.</span>
          </h1>
          <div className="mt-7 flex items-center gap-4">
            <SearchToBuild className="h-8 w-[200px] shrink-0 text-foreground/70 sm:w-[240px]" />
            <span className="h-px flex-1 bg-foreground/12" aria-hidden="true" />
          </div>
        </div>

        {/* בלוק מוצר (עטיפה+מחיר+CTA) + טקסט */}
        <div className="grid flex-1 items-center gap-x-14 gap-y-8 py-6 lg:gap-y-10 lg:py-10 lg:grid-cols-[1fr_minmax(0,23rem)]">
          {/* טקסט (ימין בדסקטופ, שני במובייל) */}
          <div className="order-2 lg:order-1">
            <p className="max-w-[42ch] text-[19px] leading-[1.65] text-foreground-muted sm:text-[20px]">
              {hero.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-foreground/12 pt-5 text-[14.5px] text-foreground-muted">
              <span>קובץ דיגיטלי לקריאה ב{siteConfig.digital.devices}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-border-strong" />
              <span>הגישה נשלחת במייל לאחר התשלום</span>
            </div>
          </div>

          {/* בלוק מוצר (שמאל בדסקטופ, ראשון במובייל). במסך הראשון במובייל
              רואים ספר, 98 ₪ (בתוך ה-CTA) ו-CTA. */}
          <div className="order-1 flex flex-col items-center gap-5 lg:order-2 lg:gap-6">
            <figure className="flex flex-col items-center gap-2">
              <div className="relative w-[140px] sm:w-[220px] lg:w-[300px]">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 start-1/2 h-7 w-[74%] -translate-x-1/2 rounded-[50%] bg-[color:var(--color-ink)]/22 blur-2xl"
                />
                <BookCover priority className="w-full" />
              </div>
              <figcaption className="text-[11px] uppercase tracking-[0.12em] text-foreground-muted sm:text-[12px]">
                עטיפה זמנית · הכריכה הסופית בקרוב
              </figcaption>
            </figure>

            <div className="flex w-full max-w-[320px] flex-col items-center gap-3">
              <Button asChild size="lg" className="h-14 w-full px-4 text-[16px] sm:text-[17px]">
                <Link href="/#purchase">לרכישת הספר הדיגיטלי — {priceLabel}</Link>
              </Button>
              <Link
                href="/#sample"
                className="group inline-flex items-center gap-2 text-[16px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                לקריאת טעימה
                <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* רמז להמשך (סטטי — ללא אנימציה אינסופית) */}
        <div className="flex items-center justify-center gap-2 pb-6 text-[13px] text-foreground-muted">
          <ArrowDown className="h-4 w-4 text-brand" aria-hidden="true" />
          <span>דייטינג הוא חיפוש. אהבה היא בנייה.</span>
        </div>
      </Container>
    </section>
  );
}
