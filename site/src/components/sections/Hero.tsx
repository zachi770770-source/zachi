import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { TrustBar } from "@/components/sections/TrustBar";
import { CompassHeroCta } from "@/components/compass/CompassHeroCta";

/**
 * Hero — גריד אמיתי של שתי עמודות: 54% תוכן (ימין ב-RTL) / 46% ספר (שמאל),
 * מיושר אנכית למרכז. יחידת תוכן רציפה אחת.
 *
 * מצב Pre-launch: ה-CTA הראשי פעיל ומזמין להצטרף לרשימת ההמתנה
 * ("קבלו עדכון כשהספר יוצא") ומגלגל אל טופס ההרשמה. אין כפתור רכישה חסום.
 * כאשר salesOpen יהפוך ל-true, אותו כפתור הופך אוטומטית ל"לרכישת הספר".
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted/50 to-background" />
        <div className="absolute -top-40 start-[10%] h-[520px] w-[520px] rounded-full bg-secondary/[0.07] blur-[120px]" />
      </div>

      <Container className="flex min-h-[calc(74svh-76px)] items-start py-5 lg:items-center lg:py-8">
        <div className="grid w-full items-center gap-y-5 lg:grid-cols-[52fr_48fr] lg:gap-x-16">
          {/* תוכן — יחידה רציפה אחת. במובייל ראשון (הצעה + CTA לפני הכריכה);
              בדסקטופ בעמודה הימנית (order-1). */}
          <div className="order-1 flex flex-col items-start">
            <span className="kicker">{hero.eyebrow}</span>

            <h1 className="type-display mt-4 text-foreground">
              אהבה לא רק מוצאים.
              <br />
              <span className="text-brand-hover">בונים אותה.</span>
            </h1>

            <p className="mt-4 text-[15px] font-semibold tracking-[0.02em] text-foreground-muted">
              מאת צחי חן
            </p>

            <p className="mt-4 max-w-[46ch] text-[21px] leading-[1.6] text-foreground/80">
              {hero.subhead}
            </p>

            {/* יחידת המרה אחת: סטטוס+מחיר, CTA ראשי ופעולה משנית — מקובצים
                תחת קו שיער עדין, כך שהמחיר והסטטוס נראים חלק מהגוש ולא טקסט
                אקראי. ה-CTA הראשי נשאר הפעולה הבולטת ביותר. */}
            <div className="mt-7 flex w-full max-w-[46ch] flex-col items-start gap-4 border-t border-border pt-6">
              <p className="text-[16px] font-semibold text-brand-hover">
                {siteConfig.preLaunchPriceLabel}
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button asChild size="lg" className="h-[60px] px-10 text-[18px] shadow-md">
                  <Link href={siteConfig.salesOpen ? "/book#purchase" : "/preview"}>
                    {siteConfig.salesOpen ? "לרכישת הספר" : "לקריאת טעימה מהספר"}
                  </Link>
                </Button>
                <Link
                  href="/#stations"
                  className="group inline-flex items-center gap-2 text-[17px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  למציאת המסלול שלי
                  <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>

              {/* „שאלו את הספר” — CTA משני במובייל בלבד, נמוך מ-CTA הטעימה */}
              <CompassHeroCta />
            </div>

            {/* רצועת אמון עדינה — עובדות מאומתות בלבד מתוך תוכן האתר */}
            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              {hero.trustFacts.map((fact) => (
                <li
                  key={fact}
                  className="flex items-center gap-2 text-[14.5px] font-medium text-foreground-muted"
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {fact}
                </li>
              ))}
            </ul>

            <TrustBar className="mt-6" />
          </div>

          {/* ספר — הכריכה במרכז במה נקייה: הילת Sage רכה מאחוריה מפרידה אותה
              מהרקע הבהיר (הפרדה טונאלית), ללא פתקים מרחפים, ללא מסגרת וללא
              רקע כהה. */}
          <div className="hero-stage order-2 flex items-center justify-center lg:self-stretch">
            {/* הילת Sage רכה — במה עדינה מאחורי הכריכה בלבד (גוון קיים) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="aspect-square w-[66%] rounded-full bg-secondary/[0.14] blur-[62px]" />
            </div>

            <figure className="hero-book relative flex flex-col items-center gap-3 lg:gap-4">
              <div className="relative w-[180px] sm:w-[320px] lg:w-[480px]">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 start-1/2 h-7 w-[72%] -translate-x-1/2 rounded-[50%] bg-[color:var(--color-ink)]/22 blur-2xl"
                />
                <BookCover priority className="w-full" />
              </div>
              <figcaption className="hero-refrain">
                <span className="hero-refrain__line">{hero.refrain[0]}</span>
                <span className="hero-refrain__line hero-refrain__line--accent">
                  {hero.refrain[1]}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </Container>
    </section>
  );
}
