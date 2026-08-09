"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { homePaths, homePathUi, type HomePathId } from "@/content/homePaths";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "mdl_home_path";

/**
 * לב עמוד הבית: „איפה זה פוגש אותך עכשיו?” — שער אמיתי לארבע חוויות. כל בחירה
 * היא *ניווט* לעמוד-המסע הייעודי (Landing אישי), לא כרטיס שנפתח בתוך הבית. אין
 * כאן עוד result-panel: הבית נשאר קצר ושער, והחוויה ממשיכה בעמוד המסלול.
 *
 * הכרטיסים הם קישורים אמיתיים (<a>) — נגישים, ניתנים ל„פתח בכרטיסייה חדשה”,
 * וקיימים ב-HTML ל-SEO. לחיצה שומרת הקשר-מסע מקומי (sessionStorage) ושולחת
 * אירוע אנונימי (מזהה תחנה בלבד), ואז מנווטת.
 */
export function HomePathSelector() {
  const choose = (id: HomePathId) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path: id }));
    } catch {
      /* אחסון חסום — לא קריטי */
    }
    trackEvent("home_path_selected", { path: id });
    trackEvent("journey_selected", { station: id });
  };

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

        {/* ארבעה שערים — כרטיס-קישור מלא ולחיץ. 2×2 בכל הרוחבים. לחיצה = ניווט
            מיידי לעמוד-המסע (בלי תוכן נוסף שנפתח בבית). */}
        <nav
          aria-label="בחירת המצב שלך במסע"
          className="mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-2.5 sm:gap-4"
        >
          {homePaths.map((p) => (
            <Link
              key={p.id}
              href={p.stationHref}
              onClick={() => choose(p.id)}
              className="group flex items-center justify-between gap-2 rounded-xl border-2 border-border bg-surface p-3 text-start transition-colors hover:border-brand/50 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:gap-3 sm:rounded-2xl sm:p-6"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-serif text-[15px] font-bold leading-tight text-foreground sm:text-[1.35rem]">
                    {p.buttonTitle}
                  </span>
                  {p.gate ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground sm:text-[12px]">
                      {homePathUi.gateBadge}
                    </span>
                  ) : null}
                </span>
                {/* שורת-משנה — מוסתרת במובייל (כרטיסי 2×2 קצרים), גלויה מ-sm. */}
                <span className="mt-1 hidden text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:block sm:text-[15px]">
                  {p.buttonSub}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand transition-transform group-hover:bg-brand-muted group-hover:-translate-x-0.5 sm:h-11 sm:w-11"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </Link>
          ))}
        </nav>
      </Container>
    </section>
  );
}
