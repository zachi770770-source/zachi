"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * #5 כרטיס כלי פרימיום — אור נקודתי עוקב-סמן + הרמה שכבתית + לחיצת „קפיץ”.
 * ה-JS מפרסם את מיקום הסמן כ-`--mx/--my` (אחוזים) לשכבת האור הרדיאלית
 * (`.tool-card__light` ב-globals.css); ההרמה/הלחיצה הן CSS בלבד. rAF-מקובץ,
 * transform/opacity בלבד. במגע/ללא מצביע עדין — אין אור עוקב (ה-CSS מגודר
 * ב-`@media (hover: hover)`), והכרטיס נשאר מלא-תפקוד. reduced-motion מנוטרל
 * ב-CSS.
 */
export function ToolCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const raf = React.useRef(0);

  const onPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return; // אור עוקב-סמן רק לעכבר
    const el = ref.current;
    if (!el || raf.current) return;
    const x = e.clientX;
    const y = e.clientY;
    raf.current = window.requestAnimationFrame(() => {
      raf.current = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((x - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((y - r.top) / r.height) * 100}%`);
    });
  }, []);

  React.useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  return (
    <div ref={ref} onPointerMove={onPointerMove} className={cn("tool-card group", className)}>
      <span aria-hidden="true" className="tool-card__light" />
      {children}
    </div>
  );
}
