"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Loader2, ArrowLeft, BookOpen, TriangleAlert } from "lucide-react";

import { compass } from "@/content/compass";
import { stations, stationOrder } from "@/content/stations";
import { trackEvent } from "@/lib/analytics";
import { formatCitation } from "@/lib/compass/answerFormat";
import { Button } from "@/components/ui/button";
import { CompassAnswer } from "@/components/compass/CompassAnswer";

/**
 * שאלות פתיחה — תוכן קיים בלבד: שלוש „שאלות למחשבה” של שלוש התחנות
 * (src/content/stations.ts). לחיצה מפעילה בדיוק את אותו זרם שאלה קיים.
 */
const STARTER_QUESTIONS = stationOrder.map((id) => stations[id].question);

type Availability = "loading" | "ready" | "soon";

type AnswerState =
  | { kind: "answered"; text: string; citation?: string }
  | { kind: "refused"; text: string }
  | { kind: "limit"; text: string }
  | { kind: "error"; text: string }
  | null;

/** מעטפת כרטיס אחידה לכל מצבי התשובה — שומרת על שפת האתר (נייר, מסגרת, רדיוס). */
const CARD_SHELL =
  "stuck-answer mt-6 rounded-lg border border-border bg-surface p-6 sm:p-8";

/** קריאות לפעולה מתחת לתשובה — לספר/רשימת המתנה ולטעימה. */
function AnswerActions({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <div className="mt-7 flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
      <Button asChild variant="outline">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
      <Link
        href={compass.cta.sampleHref}
        className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline"
      >
        {compass.cta.sampleLabel}
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * ממשק „המצפן” — עמוד ספר עריכתי, לא dashboard. כל הקריאות עוברות בשרת
 * (/api/compass); הרכיב אינו יודע על ספק המודל, על שכבת הידע או על המכסה
 * מעבר למספר שנותר. אין שמירה מקומית של תוכן, ואין שליחת מזהה אישי.
 */
export function CompassConsole({
  salesOpen,
  maxQuestionChars,
}: {
  salesOpen: boolean;
  maxQuestionChars: number;
}) {
  const [availability, setAvailability] = React.useState<Availability>("loading");
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [question, setQuestion] = React.useState("");
  const [company, setCompany] = React.useState(""); // honeypot
  const [answer, setAnswer] = React.useState<AnswerState>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  // טעינת מצב זמינות + כמה שאלות נותרו (בלי לצרוך).
  React.useEffect(() => {
    let alive = true;
    fetch("/api/compass", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data?.available) {
          setAvailability("ready");
          if (typeof data.remaining === "number") setRemaining(data.remaining);
        } else {
          setAvailability("soon");
        }
      })
      .catch(() => {
        if (alive) setAvailability("soon");
      });
    return () => {
      alive = false;
    };
  }, []);

  const outOfQuestions = remaining !== null && remaining <= 0;

  // זרם השאלה היחיד — משמש גם את שליחת הטופס וגם את „שאלות הפתיחה”.
  // ההתנהגות (fetch, מכסה, refusal, limit, error) זהה לחלוטין לקודם; שאלות
  // הפתיחה רק ממלאות שאלה קיימת ומפעילות את אותו זרם. אין שינוי ב-API/לוגיקה.
  const runQuery = React.useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < 2 || submitting || outOfQuestions) return;

      setQuestion(q);
      setSubmitting(true);
      setAnswer(null);
      trackEvent("compass_ask"); // אנונימי, ללא תוכן

      try {
        const res = await fetch("/api/compass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, company }),
        });
        const data = await res.json().catch(() => null);

        if (data && typeof data.remaining === "number") setRemaining(data.remaining);

        if (!data || data.available === false) {
          setAvailability("soon");
        } else if (data.status === "answered") {
          setAnswer({ kind: "answered", text: data.answer, citation: data.citation });
          setQuestion("");
        } else if (data.status === "refused") {
          setAnswer({ kind: "refused", text: data.answer });
        } else if (data.status === "limit") {
          setAnswer({ kind: "limit", text: data.answer });
        } else {
          setAnswer({ kind: "error", text: compass.ui.genericError });
        }
      } catch {
        setAnswer({ kind: "error", text: compass.ui.genericError });
      } finally {
        setSubmitting(false);
      }
    },
    [company, submitting, outOfQuestions]
  );

  const onSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void runQuery(question);
    },
    [runQuery, question]
  );

  // שליחה במקלדת: Ctrl/Cmd+Enter (נגישות ונוחות ללא עכבר).
  const onKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  const ctaHref = salesOpen ? compass.cta.openHref : compass.cta.closedHref;
  const ctaLabel = salesOpen ? compass.cta.openLabel : compass.cta.closedLabel;

  // מצב „בקרוב” — כשהעוזר עדיין אינו פעיל.
  if (availability === "soon") {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-surface-muted px-6 py-12 text-center sm:px-10">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-muted text-brand"
          aria-hidden="true"
        >
          <Compass className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-serif text-2xl font-semibold text-foreground">
          {compass.soon.title}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-foreground-muted">
          {compass.soon.text}
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
          <Link
            href={compass.cta.sampleHref}
            className="inline-flex min-h-[44px] items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline"
          >
            {compass.cta.sampleLabel}
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  const charsLeft = maxQuestionChars - question.length;
  const canSubmit = !submitting && !outOfQuestions && question.trim().length >= 2;

  return (
    <div className="mx-auto max-w-2xl">
      {/* כרטיס השאלה — עריכתי, מזמין וקומפקטי */}
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="rounded-lg border border-border bg-surface p-5 sm:p-7"
      >
        {/* honeypot נסתר */}
        <div
          className="pointer-events-none absolute -start-[9999px] top-0 h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor="compass-company">אל תמלאו שדה זה</label>
          <input
            id="compass-company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"
            aria-hidden="true"
          >
            <Compass className="h-4 w-4" />
          </span>
          <label
            htmlFor="compass-question"
            className="text-[15px] font-semibold text-foreground"
          >
            {compass.ui.inputLabel}
          </label>
        </div>

        <textarea
          id="compass-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, maxQuestionChars))}
          onKeyDown={onKeyDown}
          maxLength={maxQuestionChars}
          rows={3}
          disabled={submitting || outOfQuestions}
          placeholder={compass.ui.placeholder}
          className="mt-4 w-full resize-y rounded-lg border border-border-strong bg-surface px-4 py-3 text-[17px] leading-relaxed text-foreground placeholder:text-foreground-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-[13px] font-medium text-foreground-muted"
            aria-live="polite"
          >
            {remaining === null
              ? " "
              : outOfQuestions
                ? compass.ui.remainingNone
                : compass.ui.remaining(remaining)}
          </span>
          <span className="text-[13px] tabular-nums text-foreground-muted">
            {compass.ui.charsLeft(charsLeft)}
          </span>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="mt-4 h-[54px] w-full text-[17px]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {compass.ui.asking}
            </>
          ) : (
            <>
              <Compass className="h-4 w-4" aria-hidden="true" />
              {compass.ui.ask}
            </>
          )}
        </Button>

        <p className="mt-3 text-center text-[13px] text-foreground-muted">
          {compass.ui.hint}
        </p>
      </form>

      {/* שאלות פתיחה — מוצגות רק כשעדיין אין תשובה ואין טעינה; לחיצה מפעילה
          את אותו זרם שאלה. ה-CTA לטעימה מופיע רק אחרי תשובה מוצלחת (בתוך
          AnswerActions למטה), לא כאן. */}
      {!answer && !submitting && !outOfQuestions ? (
        <div className="mt-5">
          <p className="text-center text-[13px] font-medium text-foreground-muted">
            לא בטוחים מה לשאול? התחילו מאחת מאלה:
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {STARTER_QUESTIONS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => runQuery(q)}
                className="group flex items-start gap-2.5 rounded-lg border border-border-strong bg-surface px-4 py-3 text-start text-[14.5px] leading-relaxed text-foreground transition-colors hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Compass
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* אזור התשובה — נקרא ע"י קורא מסך */}
      <div aria-live="polite">
        {submitting ? (
          <div className={CARD_SHELL} role="status">
            <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {compass.ui.thinking}
            </p>
            <div className="mt-5 space-y-3" aria-hidden="true">
              <div className="h-3.5 animate-pulse rounded bg-surface-muted" />
              <div className="h-3.5 w-[92%] animate-pulse rounded bg-surface-muted" />
              <div className="h-3.5 w-[80%] animate-pulse rounded bg-surface-muted" />
              <div className="h-3.5 w-[64%] animate-pulse rounded bg-surface-muted" />
            </div>
          </div>
        ) : answer?.kind === "answered" ? (
          <article className={`${CARD_SHELL} border-s-2 border-s-brand`}>
            <p className="kicker">{compass.ui.answerEyebrow}</p>
            <CompassAnswer
              text={answer.text}
              className="mt-4 text-[1.2rem] leading-[1.85] text-foreground [text-wrap:pretty]"
            />
            {answer.citation ? (
              <p className="mt-6 flex items-center gap-2.5 border-t border-border pt-5 text-[14px] font-medium text-foreground-muted">
                <BookOpen className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {formatCitation(answer.citation)}
              </p>
            ) : null}
            <AnswerActions ctaHref={ctaHref} ctaLabel={ctaLabel} />
          </article>
        ) : answer?.kind === "refused" ? (
          <article className={CARD_SHELL}>
            <p className="kicker">{compass.ui.refusedEyebrow}</p>
            <div className="mt-4 flex gap-3">
              <Compass className="mt-1 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
              <p className="text-[1.08rem] leading-[1.75] text-foreground">{answer.text}</p>
            </div>
          </article>
        ) : answer?.kind === "limit" ? (
          <article className={CARD_SHELL}>
            <p className="kicker">{compass.ui.limitEyebrow}</p>
            <p className="mt-4 text-[1.08rem] leading-[1.75] text-foreground">{answer.text}</p>
            <AnswerActions ctaHref={ctaHref} ctaLabel={ctaLabel} />
          </article>
        ) : answer?.kind === "error" ? (
          <article className={CARD_SHELL} role="alert">
            <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-danger">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />
              {compass.ui.errorEyebrow}
            </p>
            <p className="mt-3 text-[1.05rem] leading-[1.7] text-foreground">{answer.text}</p>
          </article>
        ) : null}
      </div>

      <p className="mt-6 text-center text-[13.5px] leading-relaxed text-foreground-muted">
        {compass.page.clarification}
      </p>
    </div>
  );
}
