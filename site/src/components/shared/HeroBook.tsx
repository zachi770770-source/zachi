"use client";

import * as React from "react";

import { BookCover } from "@/components/shared/BookCover";

/**
 * הספר של ה-Hero — האנימציה החתומה של המוצר.
 *
 * מבנה שכבות (כדי לא לגעת בגאומטריית התלת-ממד הפנימית של הכריכה):
 *  - .hero-book-media — כניסה חד-פעמית (opacity/translate/scale + זווית 3D
 *    מרוסנת שמתיישבת), CSS-first, פועלת בכל דפדפן (מבוססת זמן, לא scroll).
 *  - .hero-book-tilt  — תגובת עומק אינטראקטיבית לעכבר (JS, ±2.5°, scale 1.015)
 *    רק במכשירי מצביע מדויק, ורק אחרי שהכניסה מתייצבת.
 *  - .book-cover      — הכריכה עצמה עם ה-rotateY(9deg) הפנימי — לא נוגעים.
 *
 * נגישות/ביצועים: prefers-reduced-motion → אין כניסה ואין הטיה (הספר מופיע
 * מיד במקומו הסופי). ההטיה מבוססת requestAnimationFrame, will-change מתווסף
 * רק בזמן הטיה פעילה, ומוסר בעזיבה. ללא לולאה ותנועה אוטומטית.
 */
export function HeroBook() {
  const tiltRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;

    // הטיה רק במצביע מדויק (דסקטופ/עכבר) וכשמותרת תנועה.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const stage = (el.closest(".hero-stage") as HTMLElement | null) ?? el;
    const MAX_DEG = 2.5;
    const MAX_SCALE = 1.015;

    const target = { rx: 0, ry: 0, s: 1, sx: 0 };
    let raf = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--book-rx", `${target.rx.toFixed(2)}deg`);
      el.style.setProperty("--book-ry", `${target.ry.toFixed(2)}deg`);
      el.style.setProperty("--book-s", target.s.toFixed(3));
      el.style.setProperty("--book-shadow-x", `${target.sx.toFixed(1)}px`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = (event.clientX - rect.left) / rect.width - 0.5; // ‎-0.5..0.5
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      // rotateY לפי ציר אופקי, rotateX הפוך לפי ציר אנכי. ±0.5 * 5 = ±2.5°.
      target.ry = nx * (MAX_DEG * 2);
      target.rx = -ny * (MAX_DEG * 2);
      target.s = MAX_SCALE;
      target.sx = nx * -10; // הצל נע מעט לכיוון ההפוך למצביע
      el.classList.add("is-tilting");
      schedule();
    };
    const onLeave = () => {
      target.rx = 0;
      target.ry = 0;
      target.s = 1;
      target.sx = 0;
      el.classList.remove("is-tilting");
      schedule();
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hero-book-media">
      <div ref={tiltRef} className="hero-book-tilt">
        <div className="relative w-[172px] sm:w-[264px] lg:w-[340px]">
          <div
            aria-hidden="true"
            className="hero-book-shadow absolute -bottom-5 start-1/2 h-10 w-[80%] rounded-[50%] bg-[color:var(--color-ink)]/25 blur-2xl"
          />
          <BookCover priority className="w-full" />
        </div>
      </div>
    </div>
  );
}
