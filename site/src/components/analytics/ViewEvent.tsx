"use client";

import * as React from "react";

import {
  trackEvent,
  type AnalyticsEventName,
  type AnalyticsPayload,
} from "@/lib/analytics";

/**
 * יורה אירוע-צפייה *פעם אחת* בעליית העמוד (Phase A). ref-guard מונע ירי כפול
 * גם אם הרכיב מתרנדר מחדש. עובר דרך `trackEvent` — כלומר consent-gated, ללא
 * PII, no-op עד שספק אנליטיקה נטען. אינו מרנדר DOM.
 *
 * שימוש: <ViewEvent event="guide_viewed" params={{ guide: slug }} />.
 */
export function ViewEvent({
  event,
  params,
}: {
  event: AnalyticsEventName;
  params?: AnalyticsPayload;
}) {
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, params);
    // params נלכד ב-closure בכוונה; ה-ref מבטיח ירי יחיד — אין תלות ב-params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
