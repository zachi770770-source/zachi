"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, RotateCcw } from "lucide-react";

import { stations } from "@/content/stations";
import {
  COMPASS_QUESTIONS,
  COMPASS_QUESTION_COUNT,
  answerLabel,
  resolveCompass,
  type CompassStationId,
} from "@/lib/compass/quiz";
import { clearCompass, loadCompass, saveCompass } from "@/lib/compass/quizStorage";
import { trackEvent } from "@/lib/analytics";

/**
 * „המצפן” — שלוש שאלות סגורות → נקודת פתיחה (תחנה) מהספר. דטרמיניסטי לחלוטין,
 * בצד-הלקוח בלבד: אין טקסט חופשי, אין API חיצוני, ואין תשובות גנרטיביות. אין
 * אחוזי-ביטחון ואין אבחנות — רק ניתוב לתוכן קיים ומאושר (src/content/stations).
 *
 * נגישות: כל שאלה היא radiogroup נטיבי (Tab + Enter/Space), התקדמות „X מתוך 3”
 * מוכרזת ב-aria-live, מצב הבחירה מסומן גם בטבעת/סימן (לא רק צבע), ותוצאה מוכרזת
 * ב-aria-live. reduced-motion: המעברים הם opacity בלבד (מנוטרלים גלובלית).
 *
 * ביקור חוזר: נשמר מקומית *רק* מזהה התחנה + מצב ההשלמה (ללא תשובות). בביקור
 * חוזר מוצג „להמשיך מהמקום שבו עצרת”. עמיד ל-localStorage ריק / חסום / פגום.
 */

const TOTAL = COMPASS_QUESTION_COUNT; // 3

const sampleCta = { href: "/preview", label: "לקריאת טעימה מהספר" };
const waitlistCta = { href: "/waitlist", label: "קבלו עדכון כשהספר יוצא" };

/** תת-כותרת — החלק התיאורי מ-h1 של התחנה (אחרי הנקודתיים), ללא כפילות השם. */
function stationSubtitle(id: CompassStationId): string {
  const parts = stations[id].h1.split(":");
  return parts.length > 1 ? parts.slice(1).join(":").trim() : "";
}

export function CompassQuiz() {
  const [answers, setAnswers] = React.useState<(number | null)[]>([null, null, null]);
  const [step, setStep] = React.useState(0); // 0..2 = שאלה; TOTAL = תוצאה
  const [resumedStation, setResumedStation] = React.useState<CompassStationId | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const startedRef = React.useRef(false);
  const resultHeadingRef = React.useRef<HTMLHeadingElement>(null);

  // ביקור חוזר — קריאה בטוחה מ-localStorage (מחזירה null אם ריק/חסום/פגום).
  // ה-setState נדחה ל-rAF (מחוץ לגוף האפקט) — נקרא רק בצד-הלקוח, בלי אי-התאמת
  // הידרציה ובלי „cascading renders”.
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      const saved = loadCompass();
      if (saved) setResumedStation(saved.stationId);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const choose = React.useCallback(
    (qIndex: number, optIndex: number) => {
      if (!startedRef.current) {
        startedRef.current = true;
        trackEvent("compass_start"); // ללא תוכן התשובה
      }
      const next = [...answers];
      next[qIndex] = optIndex;
      setAnswers(next);
      if (qIndex < TOTAL - 1) {
        setStep(qIndex + 1);
      } else {
        const complete = next.map((v) => v ?? 0);
        const res = resolveCompass(complete);
        saveCompass(res.station); // רק מזהה התחנה + השלמה
        setResumedStation(null);
        setStep(TOTAL);
        trackEvent("compass_complete"); // ללא תוכן התשובה
      }
    },
    [answers]
  );

  const restart = React.useCallback(() => {
    clearCompass();
    startedRef.current = false;
    setResumedStation(null);
    setAnswers([null, null, null]);
    setStep(0);
  }, []);

  // העברת focus לכותרת התוצאה כשמגיעים אליה (נגישות).
  React.useEffect(() => {
    if (step === TOTAL) resultHeadingRef.current?.focus();
  }, [step]);

  const done = step === TOTAL && answers.every((a) => a !== null);
  const result = done ? resolveCompass(answers.map((a) => a ?? 0)) : null;
  const showResumed =
    mounted && !!resumedStation && step === 0 && answers.every((a) => a === null);

  return (
    <div className="pathfinder mx-auto max-w-2xl">
      {/* התקדמות 1/3–3/3 (מוסתר בתצוגת תוצאה/המשך) */}
      {!done && !showResumed ? (
        <div className="mb-6 flex items-center justify-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`pathfinder__dot h-1.5 rounded-full transition-all duration-300 ${
                step > i ? "w-8 bg-brand" : step === i ? "w-8 bg-secondary" : "w-4 bg-border-strong"
              }`}
            />
          ))}
        </div>
      ) : null}

      {showResumed ? (
        // ——— ביקור חוזר: „להמשיך מהמקום שבו עצרת” ———
        <article
          key="resumed"
          className="stuck-answer rounded-2xl border border-border bg-surface p-6 text-start sm:p-8"
        >
          <p className="kicker">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            להמשיך מהמקום שבו עצרתם
          </p>
          <h2 className="mt-3 font-serif text-[1.4rem] font-semibold leading-snug text-foreground">
            {stations[resumedStation!].navLabel}
          </h2>
          {stationSubtitle(resumedStation!) ? (
            <p className="mt-1 text-[15px] font-medium text-foreground-muted">
              {stationSubtitle(resumedStation!)}
            </p>
          ) : null}
          <p className="mt-3 text-[1.05rem] leading-[1.75] text-foreground">
            {stations[resumedStation!].lead}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/${resumedStation}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[16px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              לתחנה שלי: {stations[resumedStation!].navLabel}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[sampleCta, waitlistCta].map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {c.label}
                  <ArrowLeft
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={restart}
            className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            לענות על המצפן מחדש
          </button>
        </article>
      ) : !done ? (
        // ——— שאלה נוכחית ———
        <div
          key={step}
          className="pathfinder__q rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8"
        >
          <p
            className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover"
            aria-live="polite"
          >
            שאלה {step + 1} מתוך 3
          </p>
          <h2 className="mt-3 font-serif text-[1.5rem] font-semibold leading-snug text-foreground">
            {COMPASS_QUESTIONS[step].title}
          </h2>
          <div
            role="radiogroup"
            aria-label={COMPASS_QUESTIONS[step].title}
            className="mt-6 grid gap-2.5"
          >
            {COMPASS_QUESTIONS[step].options.map((opt, i) => {
              const selected = answers[step] === i;
              return (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(step, i)}
                  className={`lift-hover group flex items-center justify-between gap-3 rounded-xl border px-5 py-4 text-start text-[1.02rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    selected
                      ? "border-brand bg-brand-muted/50 text-foreground"
                      : "border-border-strong bg-surface text-foreground hover:border-brand/40 hover:bg-surface-muted"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border-strong text-transparent"
                    }`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="mt-5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              לשאלה הקודמת
            </button>
          ) : null}
        </div>
      ) : (
        // ——— תוצאה ———
        <article
          key="result"
          className="stuck-answer rounded-2xl border border-border bg-surface p-6 text-start sm:p-8"
          aria-live="polite"
        >
          <p className="kicker">נקודת הפתיחה שלכם</p>
          <h2
            ref={resultHeadingRef}
            tabIndex={-1}
            className="mt-3 font-serif text-[1.4rem] font-semibold leading-snug text-foreground outline-none"
          >
            {stations[result!.station].navLabel}
          </h2>
          {stationSubtitle(result!.station) ? (
            <p className="mt-1 text-[15px] font-medium text-foreground-muted">
              {stationSubtitle(result!.station)}
            </p>
          ) : null}
          <p className="mt-3 text-[1.05rem] leading-[1.75] text-foreground">
            {stations[result!.station].lead}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
            {stations[result!.station].offer.paragraphs[0]}
          </p>

          {/* שני הגורמים שהובילו לתוצאה — התשובות שסימנתם (ללא אבחון). */}
          <div className="mt-5 rounded-xl border-s-2 border-brand bg-surface-muted/60 p-4">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
              מה שהוביל לכאן
            </p>
            <ul className="mt-2 grid gap-1.5">
              {result!.factorIndices.map((qi) => (
                <li key={qi} className="flex items-start gap-2 text-[15px] leading-relaxed text-foreground">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{answerLabel(qi, answers[qi] ?? 0)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* פעולות: התחנה (ראשית), טעימה, ורשימת המתנה. */}
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href={`/${result!.station}`}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[16px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              לתחנה המלאה: {stations[result!.station].navLabel}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {[sampleCta, waitlistCta].map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {c.label}
                  <ArrowLeft
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-6 border-t border-border pt-4 text-[13px] leading-relaxed text-foreground-muted">
            זו נקודת פתיחה לקריאה, לא אבחון או ייעוץ.
          </p>

          <button
            type="button"
            onClick={restart}
            className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            להתחיל מחדש
          </button>
        </article>
      )}
    </div>
  );
}
