"use client";

import * as React from "react";

import {
  trackEvent,
  hasAnalyticsConsent,
  type AnalyticsEventName,
  type AnalyticsPayload,
} from "@/lib/analytics";

/**
 * יורה אירוע-צפייה *פעם אחת בלבד* עבור העמוד (Phase A). עובר דרך `trackEvent`
 * — כלומר consent-gated, ללא PII, no-op עד שספק אנליטיקה נטען. אינו מרנדר DOM.
 *
 * עמידות בפני „אובדן צפייה ראשונה” (תיקון E1): אם בעליית העמוד עדיין אין
 * הסכמה, או שספק ה-GA4/GTM עדיין לא נטען (הסקריפטים עולים אסינכרונית *אחרי*
 * ההסכמה), האירוע אינו נזרק ואינו „נשרף” לריק — הוא ממתין וננסה שוב:
 *   1. כשמצב ההסכמה משתנה (אירוע `cookie-consent-changed`, וגם `storage`
 *      בין-לשוניות);
 *   2. וכשיש הסכמה אך הספק עדיין לא מוכן — בסקר קצר וחסום-בזמן עד שהספק נטען.
 * `trackEvent` מחזיר `true` רק כשהאירוע נשלח בפועל לספק; ה-ref מבטיח שליחה
 * *אחת* בלבד — אין כפילויות גם אם ההסכמה/הספק משתנים כמה פעמים.
 *
 * שימוש: <ViewEvent event="guide_viewed" params={{ guide: slug }} />.
 */

// סקר מוגבל-בזמן להמתנה לספק *לאחר* שיש הסכמה. הסקריפטים (afterInteractive)
// עולים בדרך-כלל תוך שנייה-שתיים; ~12ש' הם גבול-ביטחון נדיב, לא זמן צפוי.
const PROVIDER_POLL_INTERVAL_MS = 300;
const PROVIDER_POLL_MAX_ATTEMPTS = 40;

export function ViewEvent({
  event,
  params,
}: {
  event: AnalyticsEventName;
  params?: AnalyticsPayload;
}) {
  const dispatched = React.useRef(false);

  React.useEffect(() => {
    if (dispatched.current) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let polling = false;

    // ניסיון שליחה יחיד. `trackEvent` מחזיר true רק אם נשלח בפועל (הסכמה + ספק
    // מוכן). params נלכד ב-closure בכוונה — ה-ref מבטיח ירי יחיד, אין תלות בו.
    const attempt = (): boolean => {
      if (cancelled || dispatched.current) return true;
      const sent = trackEvent(event, params);
      if (sent) dispatched.current = true;
      return sent;
    };

    // סקר חסום-בזמן: מתחיל *רק* כשיש כבר הסכמה, וממתין שהספק ייטען. עוצר עם
    // ההצלחה, עם המיצוי, או עם הניקוי (ניווט/unmount). מבקר בלי הסכמה לעולם
    // אינו מפעיל סקר — ממתינים לאירוע ההסכמה במקום.
    const startPollingForProvider = () => {
      if (polling || cancelled || dispatched.current) return;
      if (!hasAnalyticsConsent()) return;
      polling = true;
      let attempts = 0;
      const tick = () => {
        if (cancelled || dispatched.current) return;
        if (attempt()) return;
        if (++attempts >= PROVIDER_POLL_MAX_ATTEMPTS) return; // ויתור שקט
        pollTimer = setTimeout(tick, PROVIDER_POLL_INTERVAL_MS);
      };
      tick();
    };

    // ניסיון מיידי בעליית העמוד — המסלול הרגיל (מבקר חוזר שכבר נתן הסכמה
    // והספק כבר מוכן) מסתיים כאן, בלי מאזינים ובלי סקר.
    if (attempt()) return;

    // עדיין לא נשלח. מאזינים לשינוי הסכמה (כולל בין-לשוניות דרך `storage`).
    const onConsentOrStorageChange = () => {
      if (dispatched.current) return;
      if (attempt()) return;
      // בדרך-כלל: הסכמה ניתנה כעת אך הספק ייטען כעבור רגע → סקר עד שיהיה מוכן.
      startPollingForProvider();
    };
    window.addEventListener("cookie-consent-changed", onConsentOrStorageChange);
    window.addEventListener("storage", onConsentOrStorageChange);

    // אם ההסכמה כבר קיימת עכשיו (המקרה של „ספק לא מוכן” גרידא) — לא נחכה
    // לאירוע שאולי לא יגיע, ונתחיל את הסקר מיד. אם אין הסכמה — no-op.
    startPollingForProvider();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      window.removeEventListener(
        "cookie-consent-changed",
        onConsentOrStorageChange,
      );
      window.removeEventListener("storage", onConsentOrStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  return null;
}
