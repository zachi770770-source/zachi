"use client";

import * as React from "react";

import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

/**
 * הפעלת ערכת-הקורא — טופס נגיש: אימייל, קוד-הפעלה מהספר, והסכמה. מבקש מינימום
 * PII (אין שם, אין מזהה-הזמנה, אין העלאת קבצים). הקוד הוא proof-of-possession של
 * הספר — לא „אימות רכישה מאמזון”. הפעלה מוצלחת פותחת גישה *מיד* דרך עוגיית-סשן
 * (HttpOnly), והלקוח מנווט ל-/reader/kit — ללא אסימון ב-URL.
 *
 * אנליטיקה: `reader_bonus_claim_started` בפעם הראשונה שנוגעים בטופס,
 * ו-`reader_bonus_claim_submitted` בהפעלה מוצלחת. אף אירוע אינו נושא אסימון/PII.
 */
type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function ReaderActivationForm() {
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
      const res = await fetch("/api/reader/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          code: String(data.get("code") ?? ""),
          consent: data.get("consent") === "on",
          company: String(data.get("company") ?? ""),
        }),
      });
      if (res.ok) {
        try {
          trackEvent("reader_bonus_claim_submitted");
        } catch {
          /* לא-קריטי */
        }
        // הגישה כבר פעילה דרך עוגיית-הסשן — מנווטים לערכה, בלי אסימון ב-URL.
        setState({ kind: "success" });
        window.location.assign("/reader/kit");
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      const fallback =
        res.status === 401
          ? "קוד ההפעלה אינו תקין. בדקו את הקוד שבספר ונסו שוב."
          : "אירעה תקלה. נסו שוב בעוד רגע.";
      setState({ kind: "error", message: body.error ?? fallback });
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
        <p className="font-semibold">ההפעלה הצליחה — פותחים את הערכה…</p>
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
        <label htmlFor="reader-code" className="text-[14px] font-semibold text-foreground">
          קוד הפעלה מהספר
        </label>
        <input id="reader-code" name="code" type="text" required minLength={4} maxLength={40} autoComplete="off" className={fieldClass} />
        <p className="mt-1 text-[13px] text-foreground-muted [text-wrap:pretty]">
          הקוד מופיע בתוך הספר — הוא שמאשר שהערכה נפתחת למי שיש לו את הספר.
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
          {state.kind === "submitting" ? "מפעיל…" : "הפעילו את ערכת הקורא"}
        </Button>
      </div>
    </form>
  );
}
