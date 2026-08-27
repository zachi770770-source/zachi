"use client";

import * as React from "react";
import { Compass, ArrowRight } from "lucide-react";

import { compass } from "@/content/compass";
import type { AskStationId } from "@/content/askRoute";
import { CompassConsole } from "@/components/compass/CompassConsole";
import { GuidanceFocusProvider, GuidanceIntro } from "@/components/guidance/GuidanceFocus";

// טעינה עצלה של המנוע המודרך: הקוד והנתונים (askRoute.ts) נטענים רק כאשר
// המשתמש פותח בפועל את „המצפן המודרך”, לא בטעינת עמוד השאלה-החופשית.
const AskRoute = React.lazy(() =>
  import("@/components/interactive/AskRoute").then((m) => ({ default: m.AskRoute })),
);

type Mode = "free-text" | "guided";

/**
 * חוויית „שאל את הספר” בעמוד /compass, במבנה דו-מצבי היררכי (לא טאבים ולא שני
 * פאנלים מתחרים):
 *   • ראשי — שאלה חופשית, מבוססת-ספר (CompassConsole).
 *   • משני — „המצפן המודרך” (AskRoute הדטרמיניסטי), למי שלא בטוח מה לשאול.
 *
 * המעבר מחליף את אזור-העבודה בצורה ברורה והפיכה: קישור מרוסן פותח את המודרך,
 * וקישור-חזרה מחזיר לשאלה החופשית. מצב-הבדיקות (uiPreview) חל רק על החוויה
 * החופשית — אין מענה חי, והשאלה נעצרת בהודעה מרוסנת. AskRoute אינו משתנה.
 */
export function CompassExperience({
  salesOpen,
  maxQuestionChars,
  uiPreview = false,
  initialStation,
}: {
  salesOpen: boolean;
  maxQuestionChars: number;
  uiPreview?: boolean;
  initialStation?: AskStationId;
}) {
  const [mode, setMode] = React.useState<Mode>("free-text");
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  // ממקדים את כותרת האזור רק אחרי מעבר יזום (לא בטעינה הראשונה) — כדי לא
  // „לגנוב” פוקוס בכניסה לעמוד, אך כן לעדכן קורא-מסך על החלפת האזור.
  const switchedRef = React.useRef(false);

  const switchTo = React.useCallback((next: Mode) => {
    switchedRef.current = true;
    setMode(next);
  }, []);

  React.useEffect(() => {
    if (switchedRef.current) headingRef.current?.focus();
  }, [mode]);

  const isFreeText = mode === "free-text";

  return (
    <GuidanceFocusProvider>
    <div className="mx-auto max-w-2xl">
      {/* כותרת-אזור יחידה שמתאימה את עצמה למצב — h1 אחד לעמוד. במצב-תגובה היא
          מתקפלת (GuidanceIntro) וה-h1 עובר ל-AnswerView, כך שהתשובה היא המוקד. */}
      <GuidanceIntro>
      <header className="text-center">
        <span className="kicker justify-center">
          {isFreeText ? compass.freeText.label : compass.guided.eyebrow}
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 font-serif type-hero text-foreground outline-none"
        >
          {isFreeText ? compass.freeText.prompt : compass.guided.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-balance text-foreground-muted">
          {isFreeText ? compass.freeText.support : compass.guided.lead}
        </p>
      </header>
      </GuidanceIntro>

      {isFreeText ? (
        <div className="mt-8 sm:mt-10">
          <CompassConsole
            salesOpen={salesOpen}
            maxQuestionChars={maxQuestionChars}
            uiPreview={uiPreview}
          />

          {/* מעבר משני, מרוסן, אל המצפן המודרך — לא פאנל מתחרה. */}
          <div className="mt-8 border-t border-border pt-6 text-center">
            <button
              type="button"
              onClick={() => switchTo("guided")}
              className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Compass className="h-4 w-4 text-brand" aria-hidden="true" />
              {compass.freeText.guidedInvite}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 sm:mt-10">
          {/* חזרה ברורה אל השאלה החופשית — הפיך תמיד. */}
          <div className="mb-6 text-center">
            <button
              type="button"
              onClick={() => switchTo("free-text")}
              className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <ArrowRight className="h-4 w-4 text-brand" aria-hidden="true" />
              {compass.freeText.backToFreeText}
            </button>
          </div>

          <React.Suspense
            fallback={
              <p className="py-10 text-center text-[15px] text-foreground-muted" role="status">
                טוען…
              </p>
            }
          >
            <AskRoute initialStation={initialStation} />
          </React.Suspense>
        </div>
      )}
    </div>
    </GuidanceFocusProvider>
  );
}
