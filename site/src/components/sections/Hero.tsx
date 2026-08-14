import Link from "next/link";
import { ArrowLeft, MessageCircleQuestion, ShoppingCart } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { BookTilt } from "@/components/shared/BookTilt";
import { BookLink } from "@/components/shared/BookLink";
import { ParallaxScroll } from "@/components/shared/ParallaxScroll";

/**
 * Hero — גריד אמיתי של שתי עמודות: תוכן (ימין ב-RTL) / ספר (שמאל), מיושר אנכית
 * למרכז. יחידת תוכן רציפה אחת, מקוצרת: כותרת, משפט הסבר אחד, מחיר, ושתי פעולות
 * בלבד — פעולה ראשית „קראו טעימה מהספר” אל /preview, ופעולה משנית
 * „מה הספר אומר על המצב שלי?” אל /compass. אין כאן בורר-פרסונה, פסקאות חוזרות
 * או CTA כפול — כל היתר חי
 * בהמשך העמוד ובדפים הייעודיים.
 *
 * מצב Pre-launch: אין כפתור רכישה חסום; כשה-salesOpen יהפוך ל-true הפעולה
 * הראשית הופכת אוטומטית ל„לרכישת הספר”.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* רקע קולנועי — שכבה ראשונה בכניסה המדורגת (hero-bg-enter): הגראדיינט
          וההילות עולים ומתרחבים ראשונים, לפני הקו/הכותרת/הספר. דקורטיבי בלבד. */}
      <div
        aria-hidden="true"
        className="hero-bg-enter pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted/60 via-background to-background" />
        <div className="absolute -top-40 start-[8%] h-[560px] w-[560px] rounded-full bg-secondary/[0.09] blur-[130px]" />
        <div className="absolute top-[22%] end-[4%] h-[360px] w-[360px] rounded-full bg-brand/[0.05] blur-[120px]" />
      </div>

      <Container className="flex items-center py-3 lg:py-6">
        <div className="grid w-full items-center gap-y-2 lg:grid-cols-[1fr_1fr] lg:gap-y-0 lg:gap-x-14">
          {/* תוכן — יחידה רציפה אחת. במובייל ראשון (הצעה + CTA לפני הכריכה);
              בדסקטופ בעמודה הימנית (order-1). */}
          <div className="order-1 flex flex-col items-start">
            {/* (1) קו המסלול הפותח — טרקוטה דק שנמשך ראשון */}
            <span className="hero-rule mb-2 lg:mb-4" aria-hidden="true" />

            <span
              className="kicker hero-fade"
              style={{ animationDelay: "180ms" }}
            >
              {hero.eyebrow}
            </span>

            {/* חשיפת כותרת שורה-אחר-שורה דרך מסכה. במובייל הכותרת ברוחב מלא
                (אין כריכה בתוך ה-Hero); הכריכה מוצגת רק בדסקטופ (hero-stage). */}
            <h1 className="type-display mt-2 text-foreground lg:mt-4">
              <span className="hero-line hero-line--1">
                <span className="hero-line__in">למצוא זה רק ההתחלה.</span>
              </span>
              <span className="hero-line hero-line--2">
                <span className="hero-line__in">
                  <span className="hero-build text-brand-hover">אהבה בונים.</span>
                </span>
              </span>
            </h1>

            {/* מובייל: משפט הסבר אחד קצר בלבד. דסקטופ: המשפט המלא (ללא שינוי). */}
            <p className="hero-fade mt-3 text-[17px] leading-[1.5] text-foreground/80 lg:hidden">
              הספר שעוזר להבין מה מנהל אתכם — ולבנות קשר טוב.
            </p>
            <p
              className="hero-fade mt-3 hidden max-w-[48ch] text-[17.5px] leading-[1.5] text-foreground/80 lg:mt-4 lg:block lg:text-[20px] lg:leading-[1.6]"
              style={{ animationDelay: "380ms" }}
            >
              בין אם אתם עוד מחפשים, בתחילת קשר או כבר בתוכו — הספר עוזר להבין
              מה באמת מנהל אתכם, ולבנות קשר טוב במקום רק לחפש אותו.
            </p>

            {/* יחידת המרה אחת: מחיר, פעולה ראשית ופעולה משנית — מקובצים תחת קו
                שיער עדין, כך שהמחיר נראה חלק מהגוש. */}
            <div className="mt-3 flex w-full max-w-[46ch] flex-col items-start gap-2.5 border-t border-border pt-3 lg:mt-5 lg:gap-3.5 lg:pt-5">
              {/* סטטוס זמינות: הספר כבר זמין לרכישה במהדורת Kindle באמזון. */}
              <p
                className="hero-fade text-[15px] font-semibold text-brand-hover lg:text-[16px]"
                style={{ animationDelay: "620ms" }}
              >
                {siteConfig.amazon.availableLabel}
              </p>

              <div
                className="hero-rise-soft flex w-full flex-col items-start gap-3 lg:gap-4"
                style={{ animationDelay: "160ms" }}
              >
                {/* פעולה ראשית: קריאת טעימה מיד וללא הרשמה (עם מעבר-כריכה
                    morphCover). אחרי פתיחת המכירה — הופכת לכפתור הרכישה. */}
                {siteConfig.salesOpen ? (
                  <Button asChild size="lg" className="h-14 w-full px-7 text-[17px] sm:w-auto">
                    <Link href="/book#purchase">לרכישת הספר</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="hero-cta-pulse h-14 w-full px-7 text-[17px] sm:w-auto"
                  >
                    <BookLink href="/preview" morphCover>
                      קראו טעימה מהספר · 2 דקות
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </BookLink>
                  </Button>
                )}

                {/* פעולת רכישה משנית — הספר זמין עכשיו באמזון (קישור חיצוני).
                    משנית לטעימה, אך ברורה: מי שכבר מוכן לקנות מגיע ישירות. */}
                <AmazonBuyLink
                  source="home"
                  className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  <ShoppingCart className="h-4 w-4 text-brand" aria-hidden="true" />
                  הספר זמין עכשיו באמזון
                  <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5" aria-hidden="true" />
                </AmazonBuyLink>

                {/* פעולה קונטקסטואלית „מה הספר אומר על המצב שלי?” → /compass —
                    כלי התאמה דטרמיניסטי (לא AI, לא ייעוץ), עם משפט-הסבר קצר שאומר
                    מה יקרה בלחיצה. גלוי בשני המכשירים. */}
                <div className="flex flex-col items-start gap-1">
                  <Link
                    href="/compass"
                    className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    <MessageCircleQuestion className="h-4 w-4 text-brand" aria-hidden="true" />
                    מה הספר אומר על המצב שלי?
                    <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5" aria-hidden="true" />
                  </Link>
                  <p className="text-[13px] leading-snug text-foreground-muted">
                    כמה שאלות קצרות — והקטע והכלי שמתאימים למה שעובר עליכם עכשיו.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ספר — הכריכה במרכז במה נקייה: הילת Sage רכה מאחוריה מפרידה אותה
              מהרקע הבהיר (הפרדה טונאלית), ללא פתקים מרחפים, ללא מסגרת וללא
              רקע כהה. */}
          <ParallaxScroll className="hero-stage order-2 hidden items-center justify-center lg:flex lg:self-stretch">
            {/* במת המוצר: הילת Sage רכה + נגיעת אור חמה עדינה מאחורי הכריכה,
                להפרדה טונאלית ולנפח (גוונים קיימים בלבד). ההילה נעה מעט עם
                הגלילה (עומק) בקצב הפוך לכריכה. */}
            <div
              aria-hidden="true"
              className="hero-depth-halo pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ transform: "translateY(calc(var(--hero-parallax, 0) * 30px))" }}
            >
              <div className="aspect-square w-[78%] rounded-full bg-secondary/[0.18] blur-[70px]" />
              <div className="absolute aspect-square w-[52%] translate-y-[8%] rounded-full bg-brand/[0.06] blur-[60px]" />
            </div>

            <figure className="hero-book relative flex flex-col items-center gap-3 lg:gap-5">
              {/* הכריכה נסחפת מעט כלפי מעלה בגלילה (פרלקסה מרוסנת) — עומק בלי
                  להפריע לטילט/למעבר-הכריכה (שיושבים על אלמנטים פנימיים). */}
              <div
                className="hero-depth-book relative w-[152px] sm:w-[264px] lg:w-[364px]"
                style={{ transform: "translateY(calc(var(--hero-parallax, 0) * -50px))" }}
              >
                {/* צל משתנה: מעמיק ונפרש עם הגלילה (פרלקסה) — עומק „חי” בזמן
                    שהכריכה נסחפת. transform/opacity בלבד (מרוכב, ללא reflow). */}
                <div
                  aria-hidden="true"
                  className="hero-book__shadow absolute -bottom-5 start-1/2 h-10 w-[80%] -translate-x-1/2 rounded-[50%] bg-[color:var(--color-ink)]/25 blur-2xl"
                  style={{
                    transform:
                      "translateX(-50%) translateY(calc(var(--hero-parallax, 0) * 10px)) scaleX(calc(1 + var(--hero-parallax, 0) * 0.22)) scaleY(calc(1 + var(--hero-parallax, 0) * 0.35))",
                    opacity: "calc(1 + var(--hero-parallax, 0) * 0.5)",
                  }}
                />
                {/* ריחוף/נשימה מתמשכים — הכריכה „חיה” גם ללא סמן (מובייל כלול).
                    שכבה ייעודית לתנועה בלבד, כדי לא להתנגש בפרלקסה (הורה),
                    בכניסה (figure) או בטילט (צאצא). מכבד reduced-motion. */}
                <div className="hero-float w-full">
                  <BookTilt className="w-full">
                    {/* הכריכה עצמה לחיצה ומובילה ל-/preview (כמו „קראו טעימה”),
                        עם אותו מעבר-כריכה רציף (morphCover). מקור המעבר
                        ([data-vt-book-source]) עוטף צמוד את הכריכה בלבד. */}
                    <BookLink
                      href="/preview"
                      morphCover
                      aria-label="הציצו בספר, לקריאת טעימה"
                      className="hero-book__link block w-full rounded-[6px] focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-brand"
                    >
                      <div data-vt-book-source className="w-full">
                        <BookCover priority className="w-full" />
                      </div>
                    </BookLink>
                  </BookTilt>
                </div>
              </div>
              {/* קו מבנה זעיר: הד למוטיב „מנקודות למבנה” — נקודת מותג במרכז,
                  סימן-בסיס עדין מתחת לכריכה. דקורטיבי בלבד. */}
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
          </ParallaxScroll>
        </div>
      </Container>
    </section>
  );
}
