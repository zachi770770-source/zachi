"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BookTilt — הטיה עדינה של הכריכה בעקבות הסמן (PHASE MOTION 4, מיקרו).
 * מוגבל ל-±4° סביב זווית-הבסיס של הכריכה. פעיל אך ורק במצביע מדויק עם hover
 * (דסקטופ) וכשאין prefers-reduced-motion — כלומר מנוטרל לחלוטין במגע.
 * ה-JS קובע רק CSS-vars (--tilt-x/--tilt-y/--tilt-lift); הטרנספורם עצמו
 * ב-globals.css. ההטיה מורגשת (±8°) ומלווה ב„הרמה” עדינה (scale) לתחושת עומק.
 */
const MAX_DEG = 8;

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

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-y", `${(px * MAX_DEG * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-x", `${(-py * MAX_DEG * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-lift", "1.035"); // הרמה קלה כלפי הצופה
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
      el.style.setProperty("--tilt-lift", "1");
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
