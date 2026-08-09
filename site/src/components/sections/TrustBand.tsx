import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";

/**
 * רצועת-אמון עובדתית — שורה אחת דחוסה, לא section. בטרום-השקה אין המלצות קוראים
 * מאושרות (features.testimonials=false), ולכן אין להציג Testimonials/דירוגים.
 * במקום זאת ארבעה מסרים עובדתיים בלבד, כולם בשורה אחת: כלים מעשיים, גישה אנושית,
 * הגבול המפורש („לא טיפול ולא אבחון”) וקישור שקט למחבר האמיתי.
 *
 * מובייל: בלוק יחיד ונמוך (~90px, הרבה מתחת למסך) — לא כרטיסים ולא רווחים גדולים.
 * דסקטופ (sm+): אותו תוכן נפרש לשורה אחת (משפט מימין, קישור-מחבר משמאל).
 */
export function TrustBand() {
  return (
    <section aria-labelledby="trust-heading" className="sm:py-6">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col gap-1.5 rounded-lg border border-border bg-surface-muted/50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:py-3.5">
          <h2
            id="trust-heading"
            className="text-[13.5px] font-semibold leading-snug text-foreground [text-wrap:pretty] sm:text-[15px]"
          >
            כלים מעשיים וגישה אנושית
            <span className="font-normal text-foreground-muted"> — לא טיפול ולא אבחון.</span>
          </h2>
          <Link
            href="/author"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:text-[13.5px]"
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
