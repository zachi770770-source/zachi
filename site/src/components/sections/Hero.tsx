import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { TrustBar } from "@/components/sections/TrustBar";

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
        <div className="absolute -top-40 start-[10%] h-[520px] w-[520px] rounded-full bg-brand/[0.06] blur-[120px]" />
      </div>

      <Container className="flex min-h-[calc(100svh-76px)] items-start py-6 lg:items-center lg:py-16">
        <div className="grid w-full items-center gap-y-6 lg:grid-cols-[52fr_48fr] lg:gap-x-16">
          {/* תוכן — יחידה רציפה אחת (ימין בדסקטופ, שני במובייל) */}
          <div className="order-2 flex flex-col items-start lg:order-1">
            <span className="kicker">{hero.eyebrow}</span>

            <h1 className="type-display mt-5 text-foreground">
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

            <p className="mt-6 text-[16px] font-semibold text-brand-hover">
              {siteConfig.preLaunchPriceLabel}
            </p>

            {/* פעולה מרכזית אחת: לקרוא טעימה (או לרכוש כשהמכירה פתוחה).
                פעולה משנית קלה: למצוא את המסלול המתאים. אין שני כפתורים שווי-משקל. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
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

            <TrustBar className="mt-8" />
          </div>

          {/* ספר — „הבמה”: הרעש (מחשבות) מתפזר בגלילה והכריכה מקבלת נוכחות */}
          <div className="hero-stage order-1 flex items-center justify-center lg:order-2 lg:self-stretch">
            {/* שכבת המחשבות — דקורטיבית בלבד, מחוץ להיררכיית התוכן */}
            <div className="hero-thoughts" aria-hidden="true">
              {hero.openingThoughts.map((thought, i) => (
                <span key={thought} className={`hero-thought hero-thought--${i + 1}`}>
                  {thought}
                </span>
              ))}
            </div>

            <figure className="hero-book flex flex-col items-center gap-3 lg:gap-4">
              <div className="relative w-[134px] sm:w-[226px] lg:w-[284px]">
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
