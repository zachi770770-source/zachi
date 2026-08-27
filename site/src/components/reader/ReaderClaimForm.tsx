"use client";

import * as React from "react";

import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

/**
 * הפעלת ערכת-הקורא — טופס נגיש: אימייל, העלאת הוכחת-רכישה (צילום-מסך/תמונה/PDF),
 * והסכמה. מבקש מינימום PII (אין שם). שולח multipart ל-/api/reader/claim ומציג
 * מצב-המתנה (pending) — לעולם לא „מאומת” לפני בדיקה ידנית. הקובץ נשמר פרטי בשרת.
 *
 * אנליטיקה: `reader_bonus_claim_started` בפעם הראשונה שנוגעים בטופס,
 * ו-`reader_bonus_claim_submitted` בהגשה מוצלחת. אף אירוע אינו נושא PII/קובץ.
 */
type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/** תקרת-גודל לצד-הלקוח (5MB) — אימות אמיתי נעשה גם בשרת. */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

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

    const file = data.get("proof");
    if (!(file instanceof File) || file.size === 0) {
      setState({ kind: "error", message: "יש לצרף הוכחת רכישה (צילום-מסך או PDF)." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ kind: "error", message: "הקובץ גדול מדי (עד 5MB)." });
      return;
    }
    // consent כ-checkbox → נשלח כ-"true" מפורש (ה-API מקבל גם "on").
    data.set("consent", data.get("consent") === "on" ? "true" : "false");

    setState({ kind: "submitting" });
    try {
      // אין לקבוע content-type ידנית — הדפדפן מוסיף boundary ל-multipart.
      const res = await fetch("/api/reader/claim", { method: "POST", body: data });
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
      setState({ kind: "error", message: body.error ?? "אירעה תקלה. נסו שוב בעוד רגע." });
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
        <p className="font-semibold">קיבלנו את הבקשה ואת הוכחת הרכישה.</p>
        <p className="mt-1 text-foreground-muted">
          נעבור עליה ונשלח לכם קישור גישה לערכת הקורא לאחר האישור. (הבקשה במצב
          בדיקה — עדיין לא אושרה.)
        </p>
      </div>
    );
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[15px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return (
    <form onSubmit={onSubmit} onFocusCapture={markStarted} className="flex flex-col gap-4" noValidate>
      <div>
        <label htmlFor="reader-email" className="text-[14px] font-semibold text-foreground">
          אימייל
        </label>
        <input id="reader-email" name="email" type="email" required maxLength={254} autoComplete="email" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="reader-proof" className="text-[14px] font-semibold text-foreground">
          הוכחת רכישה
        </label>
        <input
          id="reader-proof"
          name="proof"
          type="file"
          required
          accept={ACCEPT}
          className="mt-1 w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[14px] text-foreground file:me-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-[14px] file:font-semibold file:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        <p className="mt-1 text-[13px] text-foreground-muted [text-wrap:pretty]">
          צילום-מסך או PDF של אישור הרכישה מאמזון (תמונה או PDF, עד 5MB). הקובץ
          נשמר פרטית ומשמש לאימות בלבד.
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
          {state.kind === "submitting" ? "שולח…" : "שלחו לאישור"}
        </Button>
      </div>
    </form>
  );
}
