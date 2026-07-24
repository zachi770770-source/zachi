import Link from "next/link";
import { Check, Clock3, ArrowLeft } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { SearchToBuild } from "@/components/shared/SearchToBuild";
import { TrustBar } from "@/components/sections/TrustBar";

/**
 * Hero כ"עמוד שער" של ספר: כותרת רצה על קו מסטהד, כותרת סריף ענקית ברוחב
 * מלא, מוטיב "מחיפוש לבנייה", ומתחת — טור טקסט לצד לוחית העטיפה. שפה
 * עריכתית (קווי שיער, מספור, קפיטלייז) במקום כרטיסים מעוגלים.
 */
export function Hero() {
  const digitalPrice = siteConfig.products.formats.digital.price;

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted/60 to-background" />
        <div className="grain-layer absolute inset-0 opacity-[0.04] mix-blend-multiply" />
      </div>

      <Container className="pt-5 sm:pt-7">
        {/* קו מסטהד עליון */}
        <div className="flex items-center justify-between gap-4 border-b border-foreground/15 pb-4">
          <span className="kicker">{hero.eyebrow}</span>
          <span className="hidden text-[12px] uppercase tracking-[0.16em] text-foreground-muted sm:block">
            מדייטים לאהבה
          </span>
        </div>

        {/* כותרת שער ברוחב מלא */}
        <h1 className="type-display mt-8 text-foreground sm:mt-10">
          {hero.headlineTop}
          <br />
          <span className="text-brand-hover">{hero.headlineBottom}</span>
        </h1>

        {/* מוטיב מחיפוש לבנייה על קו שיער מלא-רוחב */}
        <div className="mt-8 flex items-center gap-5 sm:mt-10">
          <SearchToBuild className="h-9 w-[220px] shrink-0 text-foreground/70 sm:w-[260px]" />
          <span className="h-px flex-1 bg-foreground/12" aria-hidden="true" />
        </div>

        {/* מתחת לשער: טקסט (ימין) + לוחית עטיפה (שמאל) */}
        <div className="grid gap-x-14 gap-y-12 pb-16 pt-12 lg:grid-cols-[1fr_minmax(0,22rem)] lg:pb-24">
          <div className="flex flex-col">
            <p className="type-lead max-w-[48ch] text-foreground-muted">
              {hero.description}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Button asChild size="lg" className="h-14 px-8 text-base">
                <Link href="/#purchase">
                  {hero.primaryCta}
                  {digitalPrice != null ? ` · ${formatPrice(digitalPrice)}` : ""}
                </Link>
              </Button>
              <Link
                href="/#sample"
                className="group inline-flex items-center gap-2 text-[15px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                {hero.secondaryCta}
                <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>

            {/* שתי מהדורות — כשורת מפרט עם קווי הפרדה, לא צ'יפים */}
            <div className="mt-10 grid grid-cols-1 border-y border-foreground/15 text-[14.5px] sm:grid-cols-2">
              <div className="flex items-center gap-2.5 border-b border-foreground/10 py-3.5 sm:border-b-0 sm:border-e sm:pe-6">
                <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span className="font-semibold text-foreground">מהדורה דיגיטלית</span>
                <span className="text-foreground-muted">— זמינה עכשיו</span>
              </div>
              <div className="flex items-center gap-2.5 py-3.5 sm:ps-6">
                <Clock3 className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
                <span className="font-semibold text-foreground">מהדורה מודפסת</span>
                <span className="text-foreground-muted">— בקרוב</span>
              </div>
            </div>

            <TrustBar className="mt-7" />
          </div>

          {/* לוחית עטיפה עם כיתוב כן (Placeholder עד שתסופק הכריכה האמיתית) */}
          <figure className="mx-auto flex w-full max-w-[340px] flex-col items-center gap-4 lg:mx-0 lg:items-start">
            <BookCover priority className="w-[230px] sm:w-[300px] lg:w-full" />
            <figcaption className="text-[12px] uppercase tracking-[0.14em] text-foreground-muted">
              עטיפה לדוגמה · הכריכה הסופית בקרוב
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
