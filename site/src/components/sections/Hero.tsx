import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { hero } from "@/content/book";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { BookTilt } from "@/components/shared/BookTilt";
import { BookLink } from "@/components/shared/BookLink";
import { ParallaxScroll } from "@/components/shared/ParallaxScroll";
import { PersonaPicker } from "@/components/persona/PersonaPicker";
import {
  PersonaHeroSubhead,
  PersonaHeroCta,
} from "@/components/persona/PersonaHeroCopy";

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

      <Container className="flex min-h-[calc(78svh-76px)] items-start py-3 lg:items-center lg:py-8">
        <div className="grid w-full items-center gap-y-3 lg:grid-cols-[1fr_1fr] lg:gap-y-0 lg:gap-x-14">
          {/* תוכן — יחידה רציפה אחת. במובייל ראשון (הצעה + CTA לפני הכריכה);
              בדסקטופ בעמודה הימנית (order-1). */}
          <div className="order-1 flex flex-col items-start">
            {/* (1) קו המסלול הפותח — טרקוטה דק שנמשך ראשון */}
            <span className="hero-rule mb-3.5 lg:mb-5" aria-hidden="true" />

            <span
              className="kicker hero-fade"
              style={{ animationDelay: "180ms" }}
            >
              {hero.eyebrow}
            </span>

            {/* (2)+(3) חשיפת כותרת שורה-אחר-שורה דרך מסכה; „בונים אותה” מתיישבת */}
            <h1 className="type-display mt-3 text-foreground lg:mt-4">
              <span className="hero-line hero-line--1">
                <span className="hero-line__in">אהבה לא רק מוצאים.</span>
              </span>
              <span className="hero-line hero-line--2">
                <span className="hero-line__in">
                  <span className="hero-build text-brand-hover">בונים אותה.</span>
                </span>
              </span>
            </h1>

            {/* משפט המיצוב: „ספר לכל המסע הזוגי” — בולט, מיד אחרי הכותרת, כדי
                שגולש חדש יבין שהספר אינו רק לדייטים. אנימציית hero-fade בלבד. */}
            <p
              className="hero-fade mt-3.5 font-serif text-[18px] font-semibold leading-snug text-brand-hover lg:mt-4 lg:text-[22px]"
              style={{ animationDelay: "380ms" }}
            >
              {hero.positioning}
            </p>

            <p
              className="hero-fade mt-3 text-[15px] font-semibold tracking-[0.02em] text-foreground-muted lg:mt-4"
              style={{ animationDelay: "460ms" }}
            >
              מאת צחי חן
            </p>

            <p
              className="hero-fade mt-3.5 max-w-[46ch] text-[17.5px] leading-[1.5] text-foreground/80 lg:mt-4 lg:text-[21px] lg:leading-[1.6]"
              style={{ animationDelay: "540ms" }}
            >
              <PersonaHeroSubhead fallback={hero.subhead} />
            </p>

            {/* פילוח מיידי — 4 פרסונות. הבחירה מתאימה את כותרת-המשנה, את ה-CTA
                ואת הבר הדביק לאורך האתר, ונשמרת בין העמודים. */}
            <PersonaPicker className="hero-fade mt-5" />

            {/* יחידת המרה אחת: סטטוס+מחיר, CTA ראשי ופעולה משנית — מקובצים
                תחת קו שיער עדין, כך שהמחיר והסטטוס נראים חלק מהגוש ולא טקסט
                אקראי. ה-CTA הראשי נשאר הפעולה הבולטת ביותר. */}
            <div className="mt-4 flex w-full max-w-[46ch] flex-col items-start gap-3 border-t border-border pt-4 lg:mt-7 lg:gap-4 lg:pt-6">
              <p
                className="hero-fade text-[16px] font-semibold text-brand-hover"
                style={{ animationDelay: "700ms" }}
              >
                {siteConfig.preLaunchPriceLabel}
              </p>

              {/* היררכיית פעולה אחת וברורה. טרום-השקה: פעולה דומיננטית *יחידה* —
                  „קראו טעימה מהספר · 2 דקות” אל /preview (עם מעבר-הכריכה
                  morphCover). אין טופס אימייל בשער: הטעימה נפתחת מיד וללא הרשמה.
                  אחרי פתיחת המכירה: אותו מקום הופך לכפתור הרכישה.
                  hero-rise-soft: תזוזה בלבד (opacity=1) ⇒ ה-CTA גלוי ולחיץ מיידית. */}
              <div
                className="hero-rise-soft flex w-full flex-col items-start gap-3 lg:gap-4"
                style={{ animationDelay: "160ms" }}
              >
                {/* CTA דינמי לפי הפרסונה שנבחרה (רק אחרי בחירה) — המשפט הרגשי של
                    אותו קהל, אל רשימת ההמתנה. „קראו טעימה” נשאר מתחתיו. */}
                <PersonaHeroCta />

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

                {/* פעולה משנית שקטה: מציאת נקודת הפתיחה (Path Finder). קישור-טקסט,
                    לא כפתור — לא שווה-משקל לפעולה הדומיננטית. */}
                <Link
                  href="/#where"
                  className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  מצאו את נקודת הפתיחה שלכם
                  <ArrowLeft className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5" aria-hidden="true" />
                </Link>

                {/* פעולה שלישונית, שקטה עוד יותר — למי שרק רוצה עדכון בהשקה. */}
                <p className="text-[13.5px] leading-relaxed text-foreground-muted">
                  רוצים רק לדעת כשהספר יוצא?{" "}
                  <Link
                    href="/#waitlist"
                    className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    הצטרפו לעדכון ההשקה
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* ספר — הכריכה במרכז במה נקייה: הילת Sage רכה מאחוריה מפרידה אותה
              מהרקע הבהיר (הפרדה טונאלית), ללא פתקים מרחפים, ללא מסגרת וללא
              רקע כהה. */}
          <ParallaxScroll className="hero-stage order-2 flex items-center justify-center lg:self-stretch">
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

            <figure className="hero-book relative flex flex-col items-center gap-4 lg:gap-5">
              {/* הכריכה נסחפת מעט כלפי מעלה בגלילה (פרלקסה מרוסנת) — עומק בלי
                  להפריע לטילט/למעבר-הכריכה (שיושבים על אלמנטים פנימיים). */}
              <div
                className="hero-depth-book relative w-[196px] sm:w-[264px] lg:w-[392px]"
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
                      aria-label="הציצו בספר — לקריאת טעימה"
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
          </ParallaxScroll>
        </div>
      </Container>
    </section>
  );
}
