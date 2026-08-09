import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";

/**
 * רצועת-אמון עובדתית (לא „קוראים אומרים”). בשלב טרום-ההשקה אין עדיין המלצות
 * קוראים מאושרות (features.testimonials=false), ולכן אין להציג Testimonials.
 * במקום זאת — אמון אנושי המבוסס אך ורק על עובדות שכבר קיימות בפרויקט: הגישה
 * שעליה הספר מבוסס, גבולותיו המפורשים (לא טיפול/אבחון), וקישור למחבר האמיתי.
 *
 * מובייל: קומפקטי מאוד — שלוש נקודות כ„שבבים” בשורה אחת (כותרות בלבד), לא
 * כרטיסים. דסקטופ (sm+): שלוש הנקודות נפתחות לכותרת + שורת-הסבר.
 */
const POINTS = [
  { title: "גישה, לא טריקים", line: "דרך להבין את עצמכם ואת הקשר — לא טכניקות כיבוש." },
  { title: "כלים ליומיום", line: "צעדים קטנים ליישום ברגעים אמיתיים." },
  { title: "בגבולות ברורים", line: "נקודת מוצא להתבוננות — לא טיפול ולא אבחון." },
] as const;

export function TrustBand() {
  return (
    <section aria-labelledby="trust-heading" className="scroll-mt-20 py-6 sm:py-12">
      <Container>
        <div className="mx-auto max-w-3xl rounded-lg border border-border bg-surface-muted/60 px-5 py-5 sm:px-8 sm:py-8">
          <span className="kicker">הגישה</span>
          <h2
            id="trust-heading"
            className="mt-2 font-serif text-[1.2rem] font-semibold leading-snug text-foreground sm:text-[1.5rem]"
          >
            נכתב מתוך התבוננות ותרגול — לא הבטחות.
          </h2>
          <p className="mt-2 max-w-[60ch] text-[14.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[15px] sm:leading-relaxed">
            ספר מעשי שנותן כלים ליומיום ומכוון אתכם לפי המקום שבו אתם נמצאים.
            לא טיפול, לא אבחון ולא תחליף לליווי מקצועי.
          </p>

          <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-6">
            {POINTS.map((p) => (
              <li
                key={p.title}
                className="flex items-center gap-1.5 sm:block sm:border-s sm:border-border sm:ps-4 sm:first:border-s-0 sm:first:ps-0"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand sm:hidden" />
                <span className="font-serif text-[14px] font-semibold text-foreground sm:text-[15px]">
                  {p.title}
                </span>
                <span className="hidden text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:mt-0.5 sm:block">
                  {p.line}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/author"
            className="group mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:mt-5"
          >
            עוד על המחבר, צחי חן
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </Container>
    </section>
  );
}
