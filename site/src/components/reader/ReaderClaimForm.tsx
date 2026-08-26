"use client";

import * as React from "react";

import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

/**
 * הפעלת ערכת-הקורא למי שכבר רכש — טופס נגיש: שם, אימייל, מזהה-הזמנה מאמזון,
 * והסכמה. מבקש רק מידע נחוץ; אין העלאת קבצים. שולח ל-/api/reader/claim ומציג
 * מצב-המתנה (pending) — לעולם לא „מאומת” לפני approval אמיתי.
 *
 * אנליטיקה: `reader_bonus_claim_started` בפעם הראשונה שנוגעים בטופס,
 * ו-`reader_bonus_claim_submitted` בהגשה מוצלחת.
 */
type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ReaderClaimForm() {
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const startedRef = React.useRef(false);

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      trackEvent("reader_bonus_claim_started");
    } catch {
      /* לא-קריטי */
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "submitting") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/reader/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          orderRef: String(data.get("orderRef") ?? ""),
          consent: data.get("consent") === "on",
          source: "reader",
          company: String(data.get("company") ?? ""),
        }),
      });
      if (res.ok) {
        try {
          trackEvent("reader_bonus_claim_submitted");
        } catch {
          /* לא-קריטי */
        }
        form.reset();
        setState({ kind: "success" });
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setState({
        kind: "error",
        message: body.error ?? "אירעה תקלה. נסו שוב בעוד רגע.",
      });
    } catch {
      setState({ kind: "error", message: "אירעה תקלה ברשת. נסו שוב." });
    }
  }

  if (state.kind === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border bg-surface p-5 text-[15px] leading-relaxed text-foreground [text-wrap:pretty]"
      >
        <p className="font-semibold">קיבלנו את הבקשה.</p>
        <p className="mt-1 text-foreground-muted">
          נעבור על הפרטים ונשלח לכם קישור גישה לערכת הקורא לאחר האישור. (הבקשה
          במצב בדיקה — עדיין לא אושרה.)
        </p>
      </div>
    );
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[15px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return (
    <form onSubmit={onSubmit} onFocusCapture={markStarted} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="reader-name" className="text-[14px] font-semibold text-foreground">
          שם
        </label>
        <input id="reader-name" name="name" type="text" required maxLength={80} autoComplete="name" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="reader-email" className="text-[14px] font-semibold text-foreground">
          אימייל
        </label>
        <input id="reader-email" name="email" type="email" required maxLength={254} autoComplete="email" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="reader-order" className="text-[14px] font-semibold text-foreground">
          מזהה הזמנה מאמזון
        </label>
        <input id="reader-order" name="orderRef" type="text" required minLength={6} maxLength={60} className={fieldClass} />
        <p className="mt-1 text-[13px] text-foreground-muted [text-wrap:pretty]">
          מספר ההזמנה מאישור הרכישה של אמזון — כדי שנוכל לוודא ולשלוח לכם גישה.
        </p>
      </div>
      {/* honeypot — נסתר מהעין ומקוראי-מסך. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="reader-company">אל תמלאו שדה זה</label>
        <input id="reader-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor="reader-consent" className="flex items-start gap-2.5 text-[14px] leading-relaxed text-foreground [text-wrap:pretty]">
        <input id="reader-consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-brand)]" />
        <span>אני מאשר/ת שתשלחו לי אימייל עם גישה לערכת הקורא.</span>
      </label>

      {state.kind === "error" ? (
        <p role="alert" className="text-[14px] font-medium text-[var(--color-brand-hover)]">
          {state.message}
        </p>
      ) : null}

      <div>
        <Button type="submit" size="lg" disabled={state.kind === "submitting"}>
          {state.kind === "submitting" ? "שולח…" : "הפעילו את ערכת הקורא"}
        </Button>
      </div>
    </form>
  );
}
