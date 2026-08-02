import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { BookTilt } from "@/components/shared/BookTilt";
import { BookLink } from "@/components/shared/BookLink";
import { CompassHeroCta } from "@/components/compass/CompassHeroCta";
import { WaitlistCta } from "@/components/waitlist/WaitlistCta";

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
            {/* (1) קו המסלול הפותח — טרקוטה דק שנמשך ראשון */}
            <span className="hero-rule mb-5" aria-hidden="true" />

            <span
              className="kicker hero-fade"
              style={{ animationDelay: "150ms" }}
            >
              {hero.eyebrow}
            </span>

            {/* (2)+(3) חשיפת כותרת שורה-אחר-שורה דרך מסכה; „בונים אותה” מתיישבת */}
            <h1 className="type-display mt-4 text-foreground">
              <span className="hero-line hero-line--1">
                <span className="hero-line__in">אהבה לא רק מוצאים.</span>
              </span>
              <span className="hero-line hero-line--2">
                <span className="hero-line__in">
                  <span className="hero-build text-brand-hover">בונים אותה.</span>
                </span>
              </span>
            </h1>

            <p
              className="hero-fade mt-4 text-[15px] font-semibold tracking-[0.02em] text-foreground-muted"
              style={{ animationDelay: "560ms" }}
            >
              מאת צחי חן
            </p>

            <p
              className="hero-fade mt-4 max-w-[46ch] text-[21px] leading-[1.6] text-foreground/80"
              style={{ animationDelay: "640ms" }}
            >
              {hero.subhead}
            </p>

            {/* יחידת המרה אחת: סטטוס+מחיר, CTA ראשי ופעולה משנית — מקובצים
                תחת קו שיער עדין, כך שהמחיר והסטטוס נראים חלק מהגוש ולא טקסט
                אקראי. ה-CTA הראשי נשאר הפעולה הבולטת ביותר. */}
            <div className="mt-7 flex w-full max-w-[46ch] flex-col items-start gap-4 border-t border-border pt-6">
              <p
                className="hero-fade text-[16px] font-semibold text-brand-hover"
                style={{ animationDelay: "720ms" }}
              >
                {siteConfig.preLaunchPriceLabel}
              </p>

              {/* פעולת המרה דומיננטית אחת. טרום-השקה: „קבלו טעימה ועדכון…”
                  שנפתחת לטופס inline ומובילה ל-/preview אחרי הרשמה מוצלחת.
                  אחרי פתיחת המכירה: אותו מקום הופך לכפתור הרכישה. הפעולה
                  המשנית („למצוא את המסלול שלי”) קלה ולא שוות-משקל.
                  hero-rise-soft: תזוזה בלבד (opacity=1) ⇒ ה-CTA גלוי ולחיץ מיידית. */}
              <div
                className="hero-rise-soft flex w-full flex-col items-start gap-3"
                style={{ animationDelay: "360ms" }}
              >
                {siteConfig.salesOpen ? (
                  <Button asChild size="lg" className="h-14 px-7 text-[17px]">
                    <Link href="/book#purchase">לרכישת הספר</Link>
                  </Button>
                ) : (
                  <WaitlistCta source="hero" openEvent="hero_waitlist_open" />
                )}
                {/* פעולות משנה שקטות. „לקריאת טעימה מהספר” מנתב ל-/preview דרך
                    BookLink — ובלחיצה רגילה הכריכה בשער נמשכת אל עמוד ההצצה. */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <BookLink
                    href="/preview"
                    morphCover
                    className="group inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    לקריאת טעימה מהספר
                    <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5" aria-hidden="true" />
                  </BookLink>
                  <Link
                    href="/#where"
                    className="group inline-flex items-center gap-2 text-[16px] font-semibold text-foreground-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    למצוא את המסלול שלי
                    <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* „שאלו את הספר” — CTA משני במובייל בלבד, נמוך מ-CTA הטעימה */}
              <CompassHeroCta />
            </div>
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
                  className="hero-book__shadow absolute -bottom-5 start-1/2 h-10 w-[80%] -translate-x-1/2 rounded-[50%] bg-[color:var(--color-ink)]/25 blur-2xl"
                />
                <BookTilt className="w-full">
                  {/* מקור המעבר „כניסה לטעימה”: הכריכה הגלויה בשער נמשכת אל
                      עטיפת עמוד ההצצה. עוטף צמוד — כדי שהצילום יתפוס את הכריכה
                      בלבד (ללא הצל שמאחוריה). */}
                  <div data-vt-book-source className="w-full">
                    <BookCover priority className="w-full" />
                  </div>
                </BookTilt>
              </div>
              {/* קו מבנה זעיר: הד למוטיב „מנקודות למבנה” — נקודת מותג במרכז,
                  סימן-בסיס עדין מתחת לכריכה. דקורטיבי בלבד. המסר „חיפוש→בנייה”
                  נמסר פעם אחת, נחרצות, בבאנד המרווה שבהמשך העמוד. */}
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
            </figure>
          </div>
        </div>
      </Container>
    </section>
  );
}
