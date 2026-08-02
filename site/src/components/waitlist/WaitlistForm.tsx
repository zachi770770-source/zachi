"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import type { WaitlistSource } from "@/lib/validation/waitlist";
import { trackEvent } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "success" | "error";

/**
 * טופס רשימת המתנה נגיש: שדה אימייל יחיד, הסכמה חובה (לא מסומנת מראש),
 * honeypot נסתר, מצבי loading/success/error אמיתיים עם aria-live, ו-RTL מלא.
 * אינו שומר דבר בצד הלקוח.
 *
 * `autoFocus` ממקד את שדה האימייל בעת הרכבה (לגילוי inline מתוך WaitlistCta).
 * `onSuccess` נקרא רק אחרי הרשמה מוצלחת אמיתית (אחרי הכרזת ההצלחה) — משמש את
 * נתיב ההמרה של PHASE 16 כדי לפתוח את /preview. בכשל אימות/שרת הוא לא נקרא.
 */
export function WaitlistForm({
  source,
  autoFocus = false,
  onSuccess,
}: {
  source: WaitlistSource;
  autoFocus?: boolean;
  onSuccess?: () => void;
}) {
  const id = React.useId();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [company, setCompany] = React.useState(""); // honeypot
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  // מיקוד שדה האימייל כשהטופס נחשף (ניהול מיקוד נגיש). פעם אחת בהרכבה.
  React.useEffect(() => {
    if (autoFocus) emailRef.current?.focus();
  }, [autoFocus]);

  const onSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!consent) {
        setStatus("error");
        setError("יש לאשר את קבלת העדכון כדי להירשם.");
        return;
      }

      setStatus("loading");
      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, consent, source, company }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setStatus("error");
          setError(data?.error ?? "אירעה תקלה. נסו שוב.");
          return;
        }
        trackEvent("waitlist_signup", { source }); // ללא כתובת אימייל
        trackEvent("waitlist_submit_success", { source }); // אירוע הצלחה אחיד (PHASE 16)
        // ייחוס מסלול הטעימה: הרשמה שהגיעה מסוף עמוד ההצצה.
        if (source === "preview") trackEvent("waitlist_from_preview");
        setStatus("success");
        // נתיב ההמרה של PHASE 16: פתיחת /preview רק אחרי הצלחה אמיתית.
        onSuccess?.();
      } catch {
        setStatus("error");
        setError("בעיית תקשורת. בדקו את החיבור ונסו שוב.");
      }
    },
    [email, consent, company, source, onSuccess]
  );

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="form-status flex items-start gap-3 rounded-lg border border-secondary/40 bg-secondary-muted px-4 py-4 text-[15px] text-foreground"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
        <span>נרשמת בהצלחה. נעדכן אותך כשהספר ייפתח לרכישה.</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {/* honeypot — נסתר מחוץ למסך (ללא aria-hidden על שדה שאפשר למקד) */}
      <div className="pointer-events-none absolute -start-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor={`${id}-company`}>אל תמלאו שדה זה</label>
        <input
          id={`${id}-company`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor={`${id}-email`}>כתובת אימייל</Label>
        <Input
          ref={emailRef}
          id={`${id}-email`}
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          aria-invalid={status === "error" && !!error}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id={`${id}-consent`}
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
        />
        <Label htmlFor={`${id}-consent`} className="font-normal leading-relaxed">
          אני מסכים/ה לקבל עדכון חד-פעמי כשהספר ייפתח לרכישה, בהתאם ל
          <Link href="/privacy" className="text-brand-hover underline underline-offset-2">
            מדיניות הפרטיות
          </Link>
          .
        </Label>
      </div>

      <div aria-live="assertive" className="min-h-[1.25rem]">
        {status === "error" && error ? (
          <p role="alert" className="form-status flex items-center gap-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            שולח...
          </>
        ) : (
          "עדכנו אותי כשהספר יוצא"
        )}
      </Button>
    </form>
  );
}
