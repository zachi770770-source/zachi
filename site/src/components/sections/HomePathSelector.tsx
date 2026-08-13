import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { homePaths, homePathUi } from "@/content/homePaths";

/**
 * לב עמוד הבית: „איפה זה פוגש אותך עכשיו?” — לא עוד תפריט ניווט בלבד, אלא רגע
 * זיהוי קטן. כל מצב הוא `<details>` נטיבי: הכותרת (summary) היא הבחירה, ופתיחתה
 * חושפת *זיהוי* קצר (משפט שמשקף מתח אמיתי של אותו שלב) + *מוקד אחד* (הבחנה/בדיקה),
 * ואז *המשך* — קישור אמיתי לעמוד-המסע. בחירה וניווט הן שתי פעולות נפרדות וברורות:
 * ה-summary פותח (אינו קישור ואינו „חוטף” קליק), והקישור מנווט.
 *
 * ארכיטקטורה: רכיב שרת בלבד (ללא "use client"), על בסיס `<details name>` נטיבי —
 * בחירה יחידה (פתיחת מצב סוגרת את הקודם) קורית בדפדפן, בלי JS ובלי state. עובד
 * גם ללא הידרציה: ה-summary נפתח נטיבית וארבעת קישורי-ההמשך קיימים ב-HTML
 * (SEO + ללא-JS). ללא persona, ללא localStorage, ללא אנליטיקה — הקשר-המסע נקבע
 * בעמוד היעד (JourneyView) כמו קודם. התוכן (זיהוי + מוקד) הוא תוכן מאושר קיים
 * מ-`homePaths` (heading + focuses[0]); אין קופי חדש.
 */
export function HomePathSelector() {
  return (
    <section id="path" className="scroll-mt-20 py-5 sm:py-10" aria-labelledby="path-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="path-heading" className="type-h2">
            {homePathUi.heading}
          </h2>
          <p className="type-lead mx-auto mt-2 max-w-[42ch] text-foreground-muted [text-wrap:pretty]">
            {homePathUi.sub}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[14px] italic text-foreground-muted">
            לא צריך לדעת הכול כדי להתחיל נכון.
          </p>
        </div>

        {/* אקורדיון-בחירה: ארבעה מצבים, מצב פתוח אחד בכל רגע (name משותף). */}
        <div className="mx-auto mt-5 grid max-w-2xl gap-2.5 sm:gap-3">
          {homePaths.map((p) => {
            const micro = p.focuses[0];
            return (
              <details
                key={p.id}
                name="home-stage"
                className="path-acc rounded-xl border-2 border-border bg-surface open:border-brand/40 open:bg-surface-muted/40"
              >
                <summary className="path-acc__summary flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3 text-start transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-serif text-[16px] font-bold leading-tight text-foreground sm:text-[1.35rem]">
                        {p.buttonTitle}
                      </span>
                      {p.gate ? (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground sm:text-[12px]">
                          {homePathUi.gateBadge}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[15px]">
                      {p.buttonSub}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="path-acc__chev inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand transition-transform sm:h-11 sm:w-11"
                  >
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </summary>

                {/* גוף החשיפה: זיהוי → מוקד אחד → המשך. תוכן מאושר קיים. */}
                <div className="path-acc__body px-3 pb-4 sm:px-5 sm:pb-5">
                  <p className="border-t border-border pt-4 font-serif text-[16px] font-semibold leading-snug text-foreground [text-wrap:pretty] sm:text-[18px]">
                    {p.heading}
                  </p>
                  <p className="mt-3 text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                    {micro.title}
                  </p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                    {micro.line}
                  </p>
                  <Link
                    href={p.stationHref}
                    className="group mt-4 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                  >
                    {p.stationLabel}
                    <ArrowLeft
                      className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </details>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
