"use client";

import * as React from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Share2,
  Check,
} from "lucide-react";

import type { WaitlistSource } from "@/lib/validation/waitlist";
import { trackEvent } from "@/lib/analytics";
import { usePersonaOptional } from "@/components/persona/PersonaProvider";
import { loadCompass } from "@/lib/compass/quizStorage";
import { stations } from "@/content/stations";
import type { CompassStationId } from "@/lib/compass/quiz";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "success" | "error";

/** דגל מקומי (ללא שרת) שמסמן שהמשתמש כבר נרשם לעדכון — כדי לא לבקש אימייל שוב
    (למשל אחרי תשובת „שאלו את הספר”). לא נשמר תוכן ולא נשלח מזהה אישי. */
export const WAITLIST_JOINED_KEY = "mdl_waitlist_joined";

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
  compact = false,
}: {
  source: WaitlistSource;
  autoFocus?: boolean;
  onSuccess?: () => void;
  /** פריסה קומפקטית (Hero): אימייל + כפתור בשורה, הסכמה קטנה מתחת. אותה
      לוגיקה, אותו API, אותה ולידציה — רק צפיפות ויזואלית. */
  compact?: boolean;
}) {
  const id = React.useId();
  // הפרסונה הפעילה (אם נבחרה) לשיוך הרשמה — שיווקי בלבד, בלי נתונים אישיים.
  const { personaId, source: personaSource } = usePersonaOptional();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [company, setCompany] = React.useState(""); // honeypot
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  // התחנה ששמורה מ„המצפן” (מקומית בלבד) — להתאמה אישית של מצב ההצלחה. *אינה*
  // נשלחת לשרת: כך אין שינוי ב-backend ואין חשיפת מידע נוסף (פרטיות).
  const [savedStation, setSavedStation] = React.useState<CompassStationId | null>(null);

  // מיקוד שדה האימייל כשהטופס נחשף (ניהול מיקוד נגיש). פעם אחת בהרכבה.
  React.useEffect(() => {
    if (autoFocus) emailRef.current?.focus();
  }, [autoFocus]);

  // קריאה בטוחה של התחנה השמורה (rAF — לא ב-body של האפקט, בלי אי-התאמת הידרציה).
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const saved = loadCompass();
      if (saved) setSavedStation(saved.stationId);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // שיתוף/העתקת קישור רגיל: Web Share כשנתמך (מובייל), אחרת העתקה ללוח.
  const shareSite = React.useCallback(async () => {
    const url = `${window.location.origin}/`;
    const data = {
      title: "מדייטים לאהבה",
      text: "ספר מעשי לדייטינג ולזוגיות מאת צחי חן",
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        return; // המשתמש ביטל — לא נופלים להעתקה
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* אין הרשאת לוח — מתעלמים בשקט */
    }
  }, []);

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
          body: JSON.stringify({
            email,
            consent,
            source,
            company,
            persona: personaId,
            personaSource,
          }),
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
        try {
          localStorage.setItem(WAITLIST_JOINED_KEY, "1");
        } catch {
          /* אחסון חסום — לא קריטי */
        }
        setStatus("success");
        onSuccess?.();
      } catch {
        setStatus("error");
        setError("בעיית תקשורת. בדקו את החיבור ונסו שוב.");
      }
    },
    [email, consent, company, source, personaId, personaSource, onSuccess]
  );

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="form-status rounded-lg border border-secondary/40 bg-secondary-muted px-5 py-5 text-start"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-secondary"
            aria-hidden="true"
          />
          <div>
            <p className="text-[16px] font-semibold text-foreground">
              נרשמת בהצלחה. הטעימה מחכה לכם.
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground-muted">
              נעדכן אתכם ברגע שהספר ייצא — בינתיים אפשר לקרוא את הטעימה עכשיו.
            </p>
            {/* התאמה אישית: אם „המצפן” הושלם — קישור לתחנה שהותאמה (מקומי בלבד). */}
            {savedStation ? (
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">
                בזמן שאתם מחכים — התחנה שלכם מהמצפן:{" "}
                <Link
                  href={`/${savedStation}`}
                  className="font-semibold text-brand-hover underline underline-offset-4"
                >
                  {stations[savedStation].navLabel}
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/preview">
              לקריאת הטעימה
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={shareSite}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                הקישור הועתק
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                שיתוף האתר
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const submitButton = (
    <Button
      type="submit"
      size="lg"
      disabled={status === "loading"}
      className={compact ? "w-full shrink-0 sm:w-auto" : "w-full"}
    >
      {status === "loading" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          שולח...
        </>
      ) : (
        "עדכנו אותי כשהספר יוצא"
      )}
    </Button>
  );

  const honeypot = (
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
  );

  const consent_ = (
    <div className="flex items-start gap-3">
      <Checkbox
        id={`${id}-consent`}
        checked={consent}
        onCheckedChange={(v) => setConsent(v === true)}
      />
      <Label
        htmlFor={`${id}-consent`}
        className={
          compact
            ? "text-[13px] font-normal leading-relaxed text-foreground-muted"
            : "font-normal leading-relaxed"
        }
      >
        אני מסכים/ה לקבל עדכון חד-פעמי כשהספר ייפתח לרכישה, בהתאם ל
        <Link href="/privacy" className="text-brand-hover underline underline-offset-2">
          מדיניות הפרטיות
        </Link>
        .
      </Label>
    </div>
  );

  const errorArea = (
    <div aria-live="assertive" className={compact ? "min-h-[1rem]" : "min-h-[1.25rem]"}>
      {status === "error" && error ? (
        <p role="alert" className="form-status flex items-center gap-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );

  if (compact) {
    // פריסת Hero: שדה + כפתור בשורה אחת (בדסקטופ), הסכמה קטנה מתחת. תווית
    // האימייל נגישה (sr-only) — placeholder אינו תחליף לתווית.
    return (
      <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-2.5">
        {honeypot}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="sm:flex-1">
            <Label htmlFor={`${id}-email`} className="sr-only">
              כתובת אימייל
            </Label>
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
              className="h-12"
            />
          </div>
          {submitButton}
        </div>
        {errorArea}
        {consent_}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {honeypot}

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

      {consent_}
      {errorArea}
      {submitButton}
    </form>
  );
}
