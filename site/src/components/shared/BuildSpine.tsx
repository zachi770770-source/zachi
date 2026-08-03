"use client";

import * as React from "react";

/**
 * #1 „קו-הבנייה” של העמוד — פס טרקוטה דק בקצה-ההתחלה (ימין ב-RTL) שמתמלא לפי
 * התקדמות הקריאה, הד למוטיב „המסלול/הבנייה”. דקורטיבי בלבד (aria-hidden).
 *
 * מונע-JS (ולא native scroll-timeline): ב-body יש overflow-x:hidden שהופך אותו
 * ל-scroll container ומשבש `scroll()`/`view()`; rAF אמין בכל מצב. מפרסם
 * `--build-progress` (0..1) על פס-המילוי; ה-CSS ממפה אותו ל-scaleY (מרוכב,
 * 60fps). מוצג רק כשמותרת תנועה (`.motion-js` ב-globals.css); reduced-motion /
 * no-JS ⇒ נסתר לגמרי, ללא השפעה על הפריסה.
 */
export function BuildSpine() {
  const fillRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - (window.innerHeight || doc.clientHeight);
      const p = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || 0) / max)) : 0;
      fill.style.setProperty("--build-progress", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="build-spine">
      <span className="build-spine__track" />
      <span ref={fillRef} className="build-spine__fill" />
    </div>
  );
}
