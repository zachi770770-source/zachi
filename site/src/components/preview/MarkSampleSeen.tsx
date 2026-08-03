"use client";

import * as React from "react";

/**
 * מסמן שהמבקר הגיע לטעימה (/preview) — משנה את שלב המסע ל-„sample”, כך שה-CTA
 * המודע-הקשר (StickyCta) יזמין להצטרף לרשימת ההמתנה בהמשך. אחסון מקומי בלבד,
 * ללא PII. לא מרנדר DOM.
 */
export function MarkSampleSeen() {
  React.useEffect(() => {
    try {
      localStorage.setItem("mdl_sample_seen", "1");
    } catch {
      /* לא קריטי */
    }
  }, []);
  return null;
}
