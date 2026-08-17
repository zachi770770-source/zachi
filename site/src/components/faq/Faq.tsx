"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import type { FaqItem } from "@/content/faq";
import { usePersonaOptional } from "@/components/persona/PersonaProvider";

/**
 * שאלות נפוצות מבוססות <details>/<summary> נטיביים: נגישים במקלדת, קריאים
 * וניתנים לפתיחה גם ללא JavaScript, והתשובות נמצאות ב-HTML לצורך סריקה.
 *
 * שיפור-מתקדם (progressive enhancement): כש-JS חי ואין reduced-motion, הפתיחה
 * *וגם* הסגירה מונפשות בצורה חלקה (Web Animations API על גובה+שקיפות של עטיפת
 * התשובה) — לא רק „קפיצה” בפתיחה. ללא JS / reduced-motion → ההתנהגות הנטיבית
 * (מיידית) נשמרת. מעקב האנליטיקה (onToggle) אינו נדרש לתפעול.
 *
 * התאמה-אישית: כשנבחרה פרסונה, השאלות המשויכות לה מוקדמות לראש הרשימה ומסומנות
 * „מותאם למצב שלכם”. הסידור מתעדכן רק אחרי ה-mount (הרינדור הראשון זהה ל-SSR).
 */
const OPEN_MS = 280;
const CLOSE_MS = 240;
const EASE = "cubic-bezier(0.33, 0, 0.2, 1)"; /* = var(--ease-standard) */

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  const { personaId } = usePersonaOptional();

  // מיון יציב: פריטי הפרסונה הפעילה ראשונים; שאר הפריטים בסדרם המקורי.
  const ordered = personaId
    ? items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const aMatch = a.item.persona === personaId ? 0 : 1;
          const bMatch = b.item.persona === personaId ? 0 : 1;
          return aMatch - bMatch || a.index - b.index;
        })
        .map((x) => x.item)
    : items;

  // לחיצה על ה-summary: פותחת/סוגרת עם אנימציית גובה+שקיפות (WAA) בשני הכיוונים.
  // ללא JS ההנדלר לא רץ והפתיחה נטיבית; תחת reduced-motion פותחים/סוגרים מיד.
  const onSummaryClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const details = event.currentTarget.closest("details");
      if (!details) return;
      const wrap = details.querySelector<HTMLElement>(".faq-answer-wrap");
      const willOpen = !details.open;

      if (!wrap || prefersReducedMotion() || typeof wrap.animate !== "function") {
        return; // התנהגות נטיבית (מיידית) — לא מונעים את ברירת המחדל.
      }

      event.preventDefault();
      if (willOpen) {
        details.open = true; // התוכן נכנס ל-DOM/פריסה, ואז מנפישים 0→גובה.
        const h = wrap.scrollHeight;
        wrap.animate(
          [
            { height: "0px", opacity: 0 },
            { height: `${h}px`, opacity: 1 },
          ],
          { duration: OPEN_MS, easing: EASE },
        );
      } else {
        const h = wrap.scrollHeight;
        const anim = wrap.animate(
          [
            { height: `${h}px`, opacity: 1 },
            { height: "0px", opacity: 0 },
          ],
          { duration: CLOSE_MS, easing: EASE },
        );
        anim.onfinish = () => {
          details.open = false; // סוגרים רק בתום אנימציית-הסגירה.
        };
      }
    },
    [],
  );

  return (
    <div className="border-y border-border">
      {ordered.map((item, index) => {
        const matched = !!personaId && item.persona === personaId;
        // ספרור עריכתי לפי סדר-התצוגה (כמו שאלון ממוספר בספר). דקורטיבי בלבד
        // ולכן aria-hidden — קורא-מסך מקבל את השאלה עצמה, בלי „אחת, שתיים”.
        const num = String(index + 1).padStart(2, "0");
        return (
          <details
            key={item.id}
            className="faq-item group border-t border-border first:border-t-0"
            onToggle={(event) => {
              if (event.currentTarget.open) {
                trackEvent("faq_open", { question_id: item.id });
              }
            }}
          >
            <summary
              onClick={onSummaryClick}
              className="grid cursor-pointer list-none grid-cols-[1.75rem_1fr_auto] items-baseline gap-x-3.5 py-6 text-start [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:grid-cols-[2.25rem_1fr_auto] sm:gap-x-4 sm:py-7"
            >
              {/* ספרה תלויה — קו-מבנה עריכתי בשוליים, טרקוטה כשפתוח */}
              <span
                aria-hidden="true"
                className="faq-num select-none font-serif text-[0.95rem] font-semibold tabular-nums leading-none text-foreground-muted transition-colors group-open:text-brand-hover"
              >
                {num}
              </span>
              <span className="flex flex-col gap-1.5">
                {matched ? (
                  <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-brand-hover">
                    מותאם למצב שלכם
                  </span>
                ) : null}
                <span className="font-serif text-[1.2rem] font-semibold leading-snug text-foreground transition-colors [text-wrap:pretty] group-hover:text-brand-hover group-open:text-brand-hover">
                  {item.question}
                </span>
              </span>
              <ChevronDown
                className="h-5 w-5 shrink-0 self-center text-brand/70 transition-transform duration-200 group-open:rotate-180 group-open:text-brand group-hover:text-brand"
                aria-hidden="true"
              />
            </summary>
            {/* עטיפה עם overflow:hidden — עליה מונפשת אנימציית הגובה (WAA).
                התשובה מיושרת אל טקסט השאלה (מעבר לעמודת הספרה). */}
            <div className="faq-answer-wrap overflow-hidden">
              <p className="faq-answer ps-[2.75rem] pe-1 pb-7 text-[1.05rem] leading-[1.8] text-foreground-muted [text-wrap:pretty] sm:ps-[3.25rem] sm:pe-8">
                {item.answer}
              </p>
            </div>
          </details>
        );
      })}
    </div>
  );
}
