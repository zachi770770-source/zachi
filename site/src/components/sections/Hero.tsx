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
                <Button asChild size="lg" className="h-14 px-7 text-[17px]">
                  <Link href={siteConfig.salesOpen ? "/book#purchase" : "/preview"}>
                    {siteConfig.salesOpen ? "לרכישת הספר" : "לקריאת טעימה מהספר"}
                  </Link>
                </Button>
                <Link
                  href="/#stations"
                  className="group inline-flex items-center gap-2 text-[17px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  למצוא את המסלול שלי
                  <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>

              {/* „שאלו את הספר” — CTA משני במובייל בלבד, נמוך מ-CTA הטעימה */}
              <CompassHeroCta />
            </div>

            <TrustBar className="mt-7" />
          </div>

          {/* ספר — הכריכה במרכז במה נקייה: הילת Sage רכה מאחוריה מפרידה אותה
              מהרקע הבהיר (הפרדה טונאלית), ללא פתקים מרחפים, ללא מסגרת וללא
              רקע כהה. */}
          <div className="hero-stage order-2 flex items-center justify-center lg:self-stretch">
            {/* במת המוצר: הילת Sage רכה + נגיעת אור חמה עדינה מאחורי הכריכה,
                להפרדה טונאלית ולנפח (גוונים קיימים בלבד) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="aspect-square w-[78%] rounded-full bg-secondary/[0.18] blur-[70px]" />
              <div className="absolute aspect-square w-[52%] translate-y-[8%] rounded-full bg-brand/[0.06] blur-[60px]" />
            </div>

            <figure className="hero-book relative flex flex-col items-center gap-4 lg:gap-5">
              <div className="relative w-[172px] sm:w-[264px] lg:w-[340px]">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-5 start-1/2 h-10 w-[80%] -translate-x-1/2 rounded-[50%] bg-[color:var(--color-ink)]/25 blur-2xl"
                />
                <BookCover priority className="w-full" />
              </div>
              {/* קו מבנה זעיר: הד למוטיב „מנקודות למבנה” — נקודת מותג במרכז,
                  מחבר את הכריכה לפזמון. דקורטיבי בלבד. */}
              <span
                aria-hidden="true"
                className="flex items-center gap-1.5 opacity-80"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
                <span className="route-line h-px w-8 bg-border-strong sm:w-12" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="route-line h-px w-8 bg-border-strong sm:w-12" />
                <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
              </span>
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
