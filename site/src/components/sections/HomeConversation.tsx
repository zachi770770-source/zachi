"use client";

import * as React from "react";
import { ArrowLeft, Compass, RotateCcw } from "lucide-react";

import { dilemmasFor, askUi, type AskStationId } from "@/content/askRoute";
import { homeConversationUi as ui } from "@/content/homeConversation";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { trackEvent } from "@/lib/analytics";

// המסלול הדטרמיניסטי נטען עצלנית — הוא ה-fallback כשהעוזר אינו זמין, וגם
// האפשרות למי שמעדיף לבחור מתוך תשובות מוכנות. אין כאן מערכת שנייה: אותו מנוע.
const AskRoute = React.lazy(() =>
  import("@/components/interactive/AskRoute").then((m) => ({ default: m.AskRoute })),
);

/**
 * רגע-ההקשבה השיחתי של עמוד הבית.
 *
 * המבקר כותב במילים שלו מה קורה, והספר מגיב באמת למה שנכתב: אחזור סגור מהספר +
 * מודל (דרך /api/compass), עם שאלת-המשך אחת מבוססת-קטעים, ותור המשך אחד. הכול
 * נשאר בצד הלקוח (session/tab) — השרת חסר-מצב ואינו שומר את מה שנכתב.
 *
 * הרכבה עם המסלול המודרך (AskRoute) — לא במקומו:
 *  • זמין → שלב-מסגור קצר (שאלת-המסגור של התחנה כשבבים להתחלה) → כתיבה חופשית →
 *    תשובה מעוגנת → שאלת המשך → תור המשך → סגירה שקטה.
 *  • „מעדיפים לבחור מתוך אפשרויות?” → מציג את AskRoute הדטרמיניסטי, עם חזרה.
 *  • לא זמין (אין סוד/מסד/גרסה) → נופל בחן ל-AskRoute הדטרמיניסטי — חוויה מלאה,
 *    לא תיבה מתה. כשהתשתית תוגדר, השיחה נדלקת מעצמה.
 */

const MAX_USER_TURNS = 3;

type Availability = "loading" | "available" | "unavailable";

type Msg =
  | { role: "user"; text: string }
  | {
      role: "assistant";
      kind: "answer";
      text: string;
      citation?: string;
      followup?: string;
    }
  | { role: "assistant"; kind: "refused" | "safety" | "limit"; text: string };

export function HomeConversation({ station }: { station?: AskStationId }) {
  const [availability, setAvailability] = React.useState<Availability>("loading");
  const [guided, setGuided] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [company, setCompany] = React.useState(""); // honeypot
  const [submitting, setSubmitting] = React.useState(false);
  const [stage, setStage] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const followupRef = React.useRef<HTMLTextAreaElement>(null);

  // זמינות: קריאה יחידה בעלייה. כישלון/לא-זמין → נופלים למסלול המודרך.
  React.useEffect(() => {
    let alive = true;
    fetch("/api/compass", { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setAvailability(data?.available ? "available" : "unavailable");
      })
      .catch(() => alive && setAvailability("unavailable"));
    return () => {
      alive = false;
    };
  }, []);

  // התקדמות שלבי-ההמתנה (תיאור מה שקורה בפועל בשרת) — לא אנימציית-הקלדה מזויפת.
  React.useEffect(() => {
    if (!submitting) return;
    const last = ui.sendingStages.length - 1;
    const t = setInterval(() => setStage((s) => (s < last ? s + 1 : s)), 1400);
    return () => clearInterval(t);
  }, [submitting]);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant") as
    | Extract<Msg, { role: "assistant" }>
    | undefined;
  const awaitingFollowup =
    !done &&
    !submitting &&
    lastAssistant?.kind === "answer" &&
    !!lastAssistant.followup &&
    userTurns < MAX_USER_TURNS;

  // הקשר לשרת: התורות הקודמים (משתמש + תשובות בלבד), חסום באורכו בסכימת השרת.
  const buildContext = React.useCallback(
    (): Array<{ role: "user" | "assistant"; text: string }> =>
      messages
        .filter((m) => m.role === "user" || (m.role === "assistant" && m.kind === "answer"))
        .map((m) => ({ role: m.role, text: m.text })),
    [messages],
  );

  const send = React.useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (q.length < 2 || submitting || done || availability !== "available") return;

      const context = buildContext();
      setMessages((prev) => [...prev, { role: "user", text: q }]);
      setInput("");
      setError(null);
      setSubmitting(true);
      setStage(0);
      if (userTurns === 0) trackEvent("compass_ask"); // אנונימי, ללא תוכן

      try {
        const res = await fetch("/api/compass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "conversation", station, question: q, context, company }),
        });
        const data = await res.json().catch(() => null);

        if (!data || data.available === false) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "refused", text: ui.error },
          ]);
          setError(ui.error);
        } else if (data.status === "answered") {
          const followup = typeof data.followup === "string" ? data.followup : undefined;
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              kind: "answer",
              text: data.answer,
              citation: typeof data.citation === "string" ? data.citation : undefined,
              followup,
            },
          ]);
          trackEvent("compass_answer_success");
          if (data.done || !followup || userTurns + 1 >= MAX_USER_TURNS) setDone(true);
        } else if (data.status === "safety") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "safety", text: data.answer },
          ]);
          setDone(true);
        } else if (data.status === "refused") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "refused", text: data.answer },
          ]);
          trackEvent("compass_refused");
          if (userTurns + 1 >= MAX_USER_TURNS) setDone(true);
        } else if (data.status === "limit") {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", kind: "limit", text: data.answer },
          ]);
          trackEvent("compass_limit");
          setDone(true);
        } else {
          setError(ui.error);
        }
      } catch {
        setError(ui.error);
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, done, availability, buildContext, userTurns, station, company],
  );

  // פוקוס נגיש: כשמופיעה שאלת המשך, מעבירים את הפוקוס לתיבת המענה.
  React.useEffect(() => {
    if (awaitingFollowup) followupRef.current?.focus({ preventScroll: true });
  }, [awaitingFollowup]);

  const reset = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setDone(false);
    setSubmitting(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send((e.currentTarget as HTMLTextAreaElement).value);
    }
  };

  // ── מצב טעינת-זמינות: שלד יציב, בלי טופס שעלול להיעלם באמצע הקלדה. ──
  if (availability === "loading") {
    return (
      <div className="mx-auto max-w-2xl" aria-busy="true">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p
            className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-brand-hover"
            role="status"
          >
            <Compass className="h-4 w-4 animate-pulse" aria-hidden="true" />
            {askUi.stationTitle}
          </p>
          <div className="mt-5 space-y-3" aria-hidden="true">
            <div className="h-3.5 animate-pulse rounded bg-surface-muted" />
            <div className="h-3.5 w-[88%] animate-pulse rounded bg-surface-muted" />
            <div className="h-3.5 w-[64%] animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    );
  }

  // ── מסלול מודרך: fallback כשלא זמין, או בחירה מפורשת של המבקר. ──
  if (availability === "unavailable" || guided) {
    return (
      <div className="mx-auto max-w-2xl">
        {availability === "available" ? (
          <div className="mb-3 flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => setGuided(false)}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {ui.backToConversation}
            </button>
          </div>
        ) : null}
        <React.Suspense
          fallback={
            <p className="py-10 text-center text-[15px] text-foreground-muted" role="status">
              {askUi.stationTitle}
            </p>
          }
        >
          <AskRoute initialStation={station} />
        </React.Suspense>
      </div>
    );
  }

  const chips = station ? dilemmasFor(station) : [];
  const canSend = !submitting && input.trim().length >= 2 && !done;

  return (
    <div className="mx-auto max-w-2xl">
      {/* honeypot נסתר */}
      <div
        className="pointer-events-none absolute -start-[9999px] top-0 h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="home-conv-company">אל תמלאו שדה זה</label>
        <input
          id="home-conv-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {/* ── התכתובת עד כה ── */}
      {messages.length > 0 ? (
        <div className="mb-4 space-y-3" aria-live="polite">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <p
                key={i}
                className="ms-auto max-w-[85%] rounded-2xl rounded-se-md bg-surface-muted px-4 py-2.5 text-[15px] leading-relaxed text-foreground"
              >
                {m.text}
              </p>
            ) : (
              <div
                key={i}
                className="max-w-[92%] rounded-2xl rounded-ss-md border border-border bg-surface px-4 py-3.5 text-start"
                data-answer-kind={m.kind}
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
                  {ui.answerEyebrow}
                </p>
                <p className="mt-1.5 text-[15.5px] leading-[1.7] text-foreground [text-wrap:pretty]">
                  {m.text}
                </p>
                {m.kind === "answer" && m.citation ? (
                  <p className="mt-2 text-[13px] text-foreground-muted">{m.citation}</p>
                ) : null}
                {m.kind === "answer" && m.followup ? (
                  <p className="mt-3 border-t border-border pt-3 font-serif text-[16px] leading-snug text-foreground">
                    {m.followup}
                  </p>
                ) : null}
              </div>
            ),
          )}
        </div>
      ) : null}

      {/* ── מצב טעינה בזמן מענה ── */}
      {submitting ? (
        <div
          className="rounded-2xl border border-border bg-surface px-4 py-3.5"
          role="status"
          aria-busy="true"
        >
          <p className="flex items-center gap-2 text-[14px] text-foreground-muted">
            <Compass className="h-4 w-4 animate-pulse text-brand" aria-hidden="true" />
            {ui.sendingStages[stage]}
          </p>
        </div>
      ) : done ? (
        // ── סגירה שקטה ──
        <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 text-start">
          <p className="text-[15px] leading-relaxed text-foreground-muted">{ui.closing}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium">
            <AmazonBuyLink
              source="home"
              className="group inline-flex items-center gap-2 font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              לרכישת הספר באמזון
              <ArrowLeft
                className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1"
                aria-hidden="true"
              />
            </AmazonBuyLink>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {ui.restart}
            </button>
          </div>
        </div>
      ) : awaitingFollowup ? (
        // ── מענה לשאלת-ההמשך ──
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label
            htmlFor="home-conv-followup"
            className="block text-[12px] font-semibold uppercase tracking-wide text-brand-hover"
          >
            {ui.followupEyebrow}
          </label>
          <textarea
            id="home-conv-followup"
            ref={followupRef}
            dir="rtl"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={ui.followupPlaceholder}
            maxLength={400}
            className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-surface p-3.5 text-[15.5px] leading-relaxed text-foreground shadow-sm outline-none placeholder:text-foreground-muted/70 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
          />
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span className="text-[12.5px] text-foreground-muted">{ui.keyboardHint}</span>
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
            >
              {ui.followupSend}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-[13.5px] text-foreground-muted" role="status">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        // ── שלב הפתיחה: מסגור קצר + הזמנה לכתיבה חופשית ──
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label
            htmlFor="home-conv-input"
            className="block font-serif text-[19px] font-semibold leading-snug text-foreground"
          >
            {ui.invitePrompt}
          </label>
          <p className="mt-1.5 text-[14px] leading-relaxed text-foreground-muted">
            {ui.inviteSupport}
          </p>

          {chips.length > 0 ? (
            <div className="mt-3">
              <p className="text-[13px] text-foreground-muted">{ui.chipsLabel}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {chips.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setInput(d.label);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-border-strong bg-surface px-3.5 py-1.5 text-[13.5px] text-foreground transition-colors hover:border-brand/50 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <textarea
            id="home-conv-input"
            ref={inputRef}
            dir="rtl"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={ui.placeholder}
            maxLength={400}
            className="mt-3 w-full resize-y rounded-xl border border-border-strong bg-surface p-3.5 text-[15.5px] leading-relaxed text-foreground shadow-sm outline-none placeholder:text-foreground-muted/70 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
          />
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span className="text-[12.5px] text-foreground-muted">{ui.keyboardHint}</span>
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"
            >
              {ui.send}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-[13.5px] text-foreground-muted" role="status">
              {error}
            </p>
          ) : null}

          {/* מעבר אל המסלול המודרך — למי שמעדיף לבחור מתוך אפשרויות. */}
          <p className="mt-4 border-t border-border pt-3 text-[13.5px] text-foreground-muted">
            {ui.guidedToggle}{" "}
            <button
              type="button"
              onClick={() => setGuided(true)}
              className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {ui.guidedToggleCta}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
