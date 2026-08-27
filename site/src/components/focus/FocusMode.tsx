"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { focusUi, getFocusSituation } from "@/content/focusMode";
import type { HomePathId } from "@/content/homePaths";
import { withViewTransition } from "@/lib/motion/viewTransition";

/**
 * Focus Mode — חוויית „איפה זה פוגש אותך עכשיו?”.
 *
 * לא שאלון עם כרטיסים שמתחלפים: זו במה שמפעילה את כלי „עובדה, סיפור, פעולה” על
 * המצב שנבחר, בשלושה שלבים ברורים ובשלוש שכבות-תנועה שנועדו להיות הבסיס לשפת-
 * התנועה של האתר (ראו `.fm-*` ב-globals.css):
 *
 *   1. Ambient — נשימת-רקע עדינה על הבמה (`.fm-ambient`), חיים שקטים ולא-מסיחים.
 *   2. Narrative — הרגע נפרד לשני נתיבים: „מה שקרה” (עובדה) מול „מה שהוספתם”
 *      (סיפור). ההפרדה מובנת *ויזואלית* — צבע, מיקום ותווית — לא רק טקסט.
 *   3. Moment (Aha) — כשהקורא/ת מפריד/ה ביוזמתו, ה-composition, ה-typography,
 *      ה-color וה-motion משתנים *יחד*: הסיפור נסוג, העובדה עולה למרכז, מוגדלת
 *      ומאושרת, ומשפט-ההפרדה נכנס. רק *אחרי* ההבנה נחשפים משפט-הגשר וה-CTA.
 *
 * המשכיות-אלמנט (shared-element): בשלב ה-Aha, פסקת-העובדה נושאת
 * `view-transition-name` ומתמזגת מהנתיב אל המרכז דרך View Transitions API
 * (feature-detected, מגודר ב-`.motion-js` בלבד). ללא תמיכה / reduced-motion /
 * ללא-JS — אותה זרימה בדיוק, במעברי-מצב מיידיים (המצב הסופי תמיד קריא ונגיש).
 *
 * שכבת-בסיס: הרכיב עולה רק כשיפור-הדרגתי (JS). כרטיסי-המצב עצמם נשארים `<a>`
 * אמיתיים ב-`HomePathEntry` — ניווט מלא ללא-JS. כאן, ה-CTA „המשיכו עם הספר”
 * ממשיך אל אותה שיחה דטרמיניסטית (`HomeConversation`) דרך `onContinue`.
 */

type Stage = "split" | "aha";

export function FocusMode({
  situationId,
  onContinue,
  onBack,
}: {
  situationId: HomePathId;
  /** ממשיך אל השיחה הדטרמיניסטית של המצב (נחשף רק אחרי ה-Aha). */
  onContinue: () => void;
  /** חזרה לבחירת-המצב. */
  onBack: () => void;
}) {
  const s = getFocusSituation(situationId);
  const [stage, setStage] = React.useState<Stage>("split");
  const revealed = stage === "aha";
  const stageRef = React.useRef<HTMLDivElement>(null);
  const ahaRef = React.useRef<HTMLDivElement>(null);

  // בטעינה: מעבירים פוקוס אל הבמה כדי שקורא/ת-מסך תגיע לתוכן החדש (במקביל
  // להתנהגות של אזור-השיחה). הרכיב נטען מחדש לכל בחירת-מצב, ולכן מתחיל תמיד
  // מ„split” דרך מצב-ההתחלה של useState — אין צורך לאפס כאן.
  React.useEffect(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  const separate = () => {
    // flushSync כדי שה-DOM של שלב ה-Aha ייצולם בתוך המעבר (המשכיות-אלמנט).
    withViewTransition(() => flushSync(() => setStage("aha")));
  };

  React.useEffect(() => {
    if (revealed) ahaRef.current?.focus({ preventScroll: true });
  }, [revealed]);

  return (
    <div
      ref={stageRef}
      tabIndex={-1}
      className="home-focus fm-stage mx-auto mt-6 max-w-2xl focus:outline-none"
      role="region"
      aria-label={focusUi.regionLabel}
      data-stage={stage}
    >
      {/* Ambient — נשימת-רקע עדינה מאחורי הבמה (שכבה 1). דקורטיבי בלבד. */}
      <span className="fm-ambient" aria-hidden="true" />

      <div className="fm-stage__inner">
        <div className="mb-4 flex justify-center sm:justify-start">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            {focusUi.backLabel}
          </button>
        </div>

        <p className="kicker">{focusUi.eyebrow}</p>
        <h3 className="fm-hero mt-2 font-serif text-[1.4rem] font-bold leading-tight text-foreground sm:text-[1.6rem]">
          {s.title}
        </h3>
        <p className="mt-2 max-w-[54ch] text-[14.5px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
          {focusUi.intro}
        </p>

        {/* Narrative — הרגע נפרד לשני נתיבים (שכבה 2). ההפרדה ויזואלית: צבע,
            מיקום ותווית. שני הנתיבים נשארים ב-DOM; ה-Aha מקפל את נתיב-הסיפור
            ומעלה את נתיב-העובדה למרכז. */}
        <div className="fm-split mt-5" data-revealed={revealed}>
          <div className="fm-lane fm-lane--fact">
            <span className="fm-lane__tag">{focusUi.factTag}</span>
            <p className="fm-fact">{s.fact}</p>
          </div>
          <div className="fm-lane fm-lane--story" aria-hidden={revealed}>
            <span className="fm-lane__tag">{focusUi.storyTag}</span>
            <p className="fm-story-text">{s.story}</p>
          </div>
        </div>

        {!revealed ? (
          <div className="fm-controls mt-6">
            <p className="text-[13.5px] leading-relaxed text-foreground-muted">
              {focusUi.storyPrompt}
            </p>
            <button
              type="button"
              onClick={separate}
              className="fm-separate mt-3 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-2.5 text-[15px] font-semibold text-foreground shadow-sm transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0"
            >
              {focusUi.separateLabel}
            </button>
          </div>
        ) : (
          <div
            ref={ahaRef}
            tabIndex={-1}
            className="fm-aha mt-6 focus:outline-none"
          >
            <p className="fm-aha__line font-serif text-[1.15rem] font-semibold leading-snug text-foreground [text-wrap:pretty] sm:text-[1.3rem]">
              {focusUi.separationLine}
            </p>
            <p className="fm-bridge fm-rise mt-4 max-w-[52ch] font-quote text-[1.02rem] leading-relaxed text-foreground-muted [text-wrap:pretty]">
              {s.bridge}
            </p>
            <div className="fm-actions fm-rise mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-[15.5px] font-semibold text-brand-foreground shadow-sm transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0"
              >
                {focusUi.continueLabel}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link
                href={s.stationHref}
                className="inline-flex items-center justify-center gap-1.5 text-[14.5px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                {s.stationLabel}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
