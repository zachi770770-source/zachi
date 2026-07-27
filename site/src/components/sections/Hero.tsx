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
 * מצב Pre-launch (reader-first): פעולה ראשית אחת — לקרוא טעימה (/preview),
 * ולצדה פעולה משנית קלה — להצטרף לרשימת ההמתנה (/waitlist). אין כפתור רכישה
 * חסום ואין עוגן פנימי לבית. כאשר salesOpen יהפוך ל-true, הפעולה הראשית
 * הופכת ל"לרכישת הספר" (/book#purchase) והטעימה עוברת לפעולה המשנית.
 */
export function Hero() {
  const salesOpen = siteConfig.salesOpen;
  const primaryCta = salesOpen
    ? { label: "לרכישת הספר", href: "/book#purchase" }
    : { label: "לקריאת טעימה מהספר", href: "/preview" };
  const secondaryCta = salesOpen
    ? { label: "לקריאת טעימה מהספר", href: "/preview" }
    : { label: "קבלו עדכון כשהספר יוצא", href: "/waitlist" };

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted/50 to-background" />
        <div className="absolute -top-40 start-[10%] h-[520px] w-[520px] rounded-full bg-brand/[0.06] blur-[120px]" />
      </div>

      <Container className="flex min-h-[calc(74svh-76px)] items-start py-5 lg:items-center lg:py-8">
        <div className="grid w-full items-center gap-y-5 lg:grid-cols-[52fr_48fr] lg:gap-x-16">
          {/* תוכן — יחידה רציפה אחת (ימין בדסקטופ, שני במובייל) */}
          <div className="order-2 flex flex-col items-start lg:order-1">
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

            <p className="mt-6 text-[16px] font-semibold text-brand-hover">
              {siteConfig.preLaunchPriceLabel}
            </p>

            {/* פעולה ראשית אחת (לקרוא טעימה, או לרכוש כשהמכירה פתוחה) ולצדה
                פעולה משנית קלה (רשימת המתנה). אין שני כפתורים שווי-משקל ואין
                עוגן פנימי לבית — שני היעדים הם עמודים אמיתיים. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Button asChild size="lg" className="h-14 px-7 text-[17px]">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              <Link
                href={secondaryCta.href}
                className="group inline-flex min-h-[44px] items-center gap-2 py-2 text-[17px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                {secondaryCta.label}
                <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>

            <TrustBar className="mt-7" />
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
