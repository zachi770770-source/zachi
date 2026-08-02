"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import type { WaitlistSource } from "@/lib/validation/waitlist";
import type { AnalyticsEventName } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

/** הניסוח האחיד של פעולת ההמרה — חוזר בשלוש נקודות ההחלטה בלבד. */
export const CONVERSION_CTA_LABEL = "קבלו טעימה ועדכון כשהספר יוצא";

/**
 * WaitlistCta — פעולת ההמרה האחת והחוזרת (PHASE 16). כפתור דומיננטי יחיד;
 * בלחיצה נחשף טופס inline קומפקטי (אימייל + הסכמה + שליחה) המשתמש ב-WaitlistForm
 * הקיים, ב-API, בוולידציה ובטיפול השגיאות הקיימים — ללא מערכת הרשמה מקבילה.
 *
 * אחרי הרשמה מוצלחת אמיתית בלבד: פותחים את /preview (נתיב מועדף, לא שער חסום —
 * „טעימה” בתפריט נשארת פתוחה לכולם). בכשל אימות/שרת אין ניווט.
 *
 * נגישות: מיקוד עובר לשדה האימייל בעת החשיפה (autoFocus), והכרזות ההצלחה/שגיאה
 * החיות מגיעות מ-WaitlistForm (aria-live).
 */
export function WaitlistCta({
  source,
  openEvent,
  align = "start",
  className,
}: {
  source: WaitlistSource;
  /** אירוע אנליטיקה שנורה כשהטופס נחשף (למשל hero_waitlist_open ב-Hero). */
  openEvent?: AnalyticsEventName;
  align?: "start" | "center";
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleOpen = React.useCallback(() => {
    setOpen(true);
    if (openEvent) trackEvent(openEvent);
  }, [openEvent]);

  const handleSuccess = React.useCallback(() => {
    trackEvent("preview_open_after_signup", { source });
    router.push("/preview");
  }, [router, source]);

  const alignClass =
    align === "center" ? "items-center text-center" : "items-start text-start";

  return (
    <div
      className={`flex w-full flex-col ${alignClass}${className ? ` ${className}` : ""}`}
    >
      {open ? (
        <div
          role="group"
          aria-label={CONVERSION_CTA_LABEL}
          className="stuck-answer w-full max-w-md rounded-xl border border-border bg-surface p-4 text-start shadow-sm sm:p-5"
        >
          <p className="text-[15px] font-semibold text-foreground">
            {CONVERSION_CTA_LABEL}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-foreground-muted">
            השאירו אימייל — נפתח לכם עכשיו את הטעימה, ונעדכן כשהספר ייצא לרכישה.
          </p>
          <div className="mt-4">
            <WaitlistForm source={source} autoFocus onSuccess={handleSuccess} />
          </div>
        </div>
      ) : (
        <Button
          type="button"
          size="lg"
          className="h-14 px-7 text-[17px]"
          aria-expanded={false}
          onClick={handleOpen}
        >
          {CONVERSION_CTA_LABEL}
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
