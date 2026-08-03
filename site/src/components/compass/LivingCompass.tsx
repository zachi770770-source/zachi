"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * #4 „המצפן החי” — טבעות + מחט שמחפשת ומתייצבת לכיוון (לא סתם מסתובבת). המחט
 * נעה עם spring (overshoot ואז התייצבות) בכניסה לתצוגה, בריחוף ובבחירת נתיב.
 *
 * הכיוון תמיד משמעותי: מנוחה = חיפוש (זווית „מפוזרת”); ריחוף/בחירה = מתכנס
 * לכיוון „הצפון” של הספר (‎-38°, לעבר ה-CTA). דקורטיבי (aria-hidden). מכבד
 * prefers-reduced-motion (מחט סטטית בכיוון היעד, ללא spring). transform בלבד.
 */
const REST = 34; // „מחפש”
const FOUND = -38; // „מצא כיוון” (לעבר הפעולה)
const HOVER = -52;

export function LivingCompass({
  className,
  seek,
}: {
  className?: string;
  /** דרוך מבחוץ (למשל בבחירת נתיב) — קופץ לכיוון ומתייצב. */
  seek?: number;
}) {
  const ref = React.useRef<SVGSVGElement>(null);
  const reduce =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  const [angle, setAngle] = React.useState(reduce ? FOUND : REST);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduce || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e], obs) => {
        if (e.isIntersecting) {
          setAngle(FOUND); // ה-easing (back-out) גורם ל-overshoot והתייצבות
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  // דריכה חיצונית (בחירת נתיב): קפיצה עדינה סביב הכיוון ואז התייצבות.
  React.useEffect(() => {
    if (reduce || seek === undefined) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- דריכה חיצונית מכוונת
    setAngle(HOVER);
    const t = setTimeout(() => setAngle(FOUND), 240);
    return () => clearTimeout(t);
  }, [seek, reduce]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={cn("living-compass", className)}
      onPointerEnter={() => !reduce && setAngle(HOVER)}
      onPointerLeave={() => !reduce && setAngle(FOUND)}
    >
      {/* טבעות */}
      <circle cx="50" cy="50" r="46" className="living-compass__ring-outer" />
      <circle cx="50" cy="50" r="34" className="living-compass__ring-inner" />
      {/* שנתות ראשיות (N/E/S/W) */}
      {[0, 90, 180, 270].map((d) => (
        <line
          key={d}
          x1="50"
          y1="6"
          x2="50"
          y2="13"
          className="living-compass__tick"
          transform={`rotate(${d} 50 50)`}
        />
      ))}
      {/* המחט */}
      <g
        className="living-compass__needle"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <path d="M50 12 L55 50 L50 56 L45 50 Z" className="living-compass__north" />
        <path d="M50 88 L45 50 L50 44 L55 50 Z" className="living-compass__south" />
      </g>
      <circle cx="50" cy="50" r="3.4" className="living-compass__hub" />
    </svg>
  );
}
