"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Loader2, ArrowLeft, BookOpen } from "lucide-react";

import { compass } from "@/content/compass";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

type Availability = "loading" | "ready" | "soon";

type AnswerState =
  | { kind: "answered"; text: string; citation?: string }
  | { kind: "refused"; text: string }
  | { kind: "limit"; text: string }
  | { kind: "error"; text: string }
  | null;

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

  const onSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const q = question.trim();
      if (q.length < 2 || submitting || outOfQuestions) return;

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
    [question, company, submitting, outOfQuestions]
  );

  const ctaHref = salesOpen ? compass.cta.openHref : compass.cta.closedHref;
  const ctaLabel = salesOpen ? compass.cta.openLabel : compass.cta.closedLabel;

  // מצב „בקרוב” — כשהעוזר עדיין אינו פעיל.
  if (availability === "soon") {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface-muted px-6 py-10 text-center sm:px-10 sm:py-12">
        <Compass className="mx-auto h-8 w-8 text-brand" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
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
            className="inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline"
          >
            {compass.cta.sampleLabel}
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  const charsLeft = maxQuestionChars - question.length;

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
        {/* honeypot נסתר */}
        <div className="pointer-events-none absolute -start-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
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

        <label htmlFor="compass-question" className="block text-[15px] font-semibold text-foreground">
          {compass.ui.inputLabel}
        </label>
        <textarea
          id="compass-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, maxQuestionChars))}
          maxLength={maxQuestionChars}
          rows={3}
          disabled={submitting || outOfQuestions}
          placeholder={compass.ui.placeholder}
          className="mt-3 w-full resize-y rounded-2xl border border-border-strong bg-surface px-4 py-3 text-[17px] leading-relaxed text-foreground placeholder:text-foreground-muted/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-foreground-muted" aria-live="polite">
            {remaining === null
              ? " "
              : outOfQuestions
                ? compass.ui.remainingNone
                : compass.ui.remaining(remaining)}
          </span>
          <span className="text-[13px] text-foreground-muted">{compass.ui.charsLeft(charsLeft)}</span>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting || outOfQuestions || question.trim().length < 2}
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
      </form>

      {/* אזור התשובה — נקרא ע"י קורא מסך */}
      <div aria-live="polite" className="mt-6">
        {answer ? (
          <article className="stuck-answer rounded-3xl border border-border bg-surface px-5 py-6 sm:px-8 sm:py-8">
            {answer.kind === "answered" ? (
              <>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                  {compass.ui.answerEyebrow}
                </p>
                <p className="mt-3 whitespace-pre-line text-[1.15rem] leading-[1.75] text-foreground">
                  {answer.text}
                </p>
                {answer.citation ? (
                  <p className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-[14px] text-foreground-muted">
                    <BookOpen className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    {answer.citation}
                  </p>
                ) : null}
                <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <Button asChild variant="outline">
                    <Link href={ctaHref}>{ctaLabel}</Link>
                  </Button>
                  <Link
                    href={compass.cta.sampleHref}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline"
                  >
                    {compass.cta.sampleLabel}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-[1.05rem] leading-[1.7] text-foreground">{answer.text}</p>
            )}
          </article>
        ) : null}
      </div>

      <p className="mt-6 text-center text-[13.5px] leading-relaxed text-foreground-muted">
        {compass.page.clarification}
      </p>
    </div>
  );
}
