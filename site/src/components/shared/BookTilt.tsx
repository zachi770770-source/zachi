"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BookTilt — הטיה עדינה של הכריכה בעקבות הסמן (PHASE MOTION 4, מיקרו).
 * פעיל אך ורק במצביע מדויק עם hover (דסקטופ) וכשאין prefers-reduced-motion —
 * כלומר מנוטרל לחלוטין במגע.
 *
 * ה-JS קובע רק CSS-vars (--tilt-x/--tilt-y/--tilt-lift) על אלמנט אחד, בתוך
 * rAF מווסת. אין state, אין re-render של React בשום תנועת-סמן, והריכוך עצמו
 * נעשה ב-CSS (transition על הטרנספורם) ולא בלולאת JS.
 *
 * הטווח צומצם מ-±4° ל-±2.5°: ב-4° הכריכה „עוקבת” אחרי הסמן בצורה מורגשת,
 * וזה נקרא ככרטיס אינטראקטיבי. ב-2.5° נשארת רק תחושת החומר — העצם מגיב לאור
 * ולמבט מבלי להפוך לצעצוע. גם ה„הרמה” רוככה (1.025→1.015).
 */
const MAX_DEG = 2.5;

export function BookTilt({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!finePointer?.matches || reduce?.matches) return; // דסקטופ + תנועה בלבד

    // הצל יושב מחוץ לתת-העץ הזה (אח, לא צאצא), ומשתני-CSS יורשים כלפי מטה
    // בלבד — לכן מסמנים אב משותף שממנו הם יורדים גם אליו.
    const scope = el.closest<HTMLElement>("[data-tilt-scope]");

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-y", `${(px * MAX_DEG * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-x", `${(-py * MAX_DEG * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-lift", "1.015"); // הרמה קלה כלפי הצופה
        // הצל נע נגד ההטיה: כשהכריכה נוטה ימינה הצל נמשך שמאלה, כמו עצם מעל
        // משטח. זה מה שמונע מהטילט להיראות כמו תמונה שמסתובבת.
        scope?.style.setProperty("--tilt-shadow-x", `${(-px * 10).toFixed(1)}px`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--tilt-lift", "1");
      scope?.style.setProperty("--tilt-shadow-x", "0px");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={cn("book-tilt", className)}>
      {children}
    </div>
  );
}
