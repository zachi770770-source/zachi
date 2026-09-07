"use client";

import * as React from "react";

import { markSampled } from "@/lib/journeyStage";

/**
 * מסמן שהטעימה נקראה — ומכאן ה-CTA מודע-ההקשר מציע את הצעד הבא (הספר) במקום
 * להזמין שוב לקרוא את מה שכבר נקרא.
 *
 * הסימון מותנה בקריאה *ממשית*, לא בטעינת העמוד. קודם הוא נשמר ב-mount, כלומר
 * מבקר שנחת ל-200ms וחזר נחשב „קרא”. עכשיו נדרש אחד משניים: גלילה של לפחות
 * 45% מגובה התוכן, או שהות של 25 שניות בעמוד. שני הסימנים זמינים מקומית ואינם
 * מדווחים לשום מקום.
 *
 * ניקוי: המאזין וה-timeout מוסרים בפירוק, והדגל `done` מונע סימון כפול או
 * קריאה אחרי unmount. לא מרנדר DOM.
 */
export function MarkSampleSeen() {
  React.useEffect(() => {
    let done = false;
    let raf = 0;

    const finish = () => {
      if (done) return;
      done = true;
      markSampled();
      cleanup();
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - (window.innerHeight || doc.clientHeight);
        if (max <= 0) return; // תוכן קצר מהמסך — נשען על שהות בלבד
        if ((window.scrollY || 0) / max >= 0.45) finish();
      });
    };

    const dwell = window.setTimeout(finish, 25000);

    function cleanup() {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(dwell);
      if (raf) window.cancelAnimationFrame(raf);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return cleanup;
  }, []);

  return null;
}
