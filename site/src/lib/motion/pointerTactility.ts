"use client";

import * as React from "react";

/**
 * חומריות-מצביע לכרטיסים אינטראקטיביים — אור לפי מיקום הסמן, הטיה זעירה,
 * ולחיצה עם תחושת-קפיץ. בלי ספריית-אנימציה: ה-JS כותב משתני-CSS בלבד בתוך
 * rAF מווסת, וה-CSS עושה את הריכוך. אין state ואין re-render בשום תנועת-סמן.
 *
 * מופעל **רק** במצביע מדויק עם hover (דסקטופ) וכשאין prefers-reduced-motion.
 * במגע/מצביע-גס: אין אור ואין הטיה — נשאר משוב-לחיצה/בחירה נקי בלבד (CSS).
 *
 * מירוצים וניקוי: ה-rAF התלוי-ועומד מבוטל לפני כל תזמון חדש ובפירוק; כל
 * המאזינים נרשמים על מכל אחד (delegation) ומוסרים ב-cleanup; `pointercancel`
 * ו-`pointerleave` מנקים את מצב-הלחיצה, כך שלא נשאר כרטיס „לחוץ” אם המצביע
 * יצא מהחלון או שהמערכת גנבה את האירוע.
 */
export function usePointerTactility(
  ref: React.RefObject<HTMLElement | null>,
  cardSelector: string,
) {
  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    let raf = 0;
    let pressed: HTMLElement | null = null;

    const clearCard = (el: HTMLElement) => {
      el.style.removeProperty("--px");
      el.style.removeProperty("--py");
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
    };

    const onMove = (e: PointerEvent) => {
      if (!fine.matches || reduce.matches) return;
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(cardSelector);
      if (!card) return;
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width; // 0..1
      const ny = (e.clientY - r.top) / r.height;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        card.style.setProperty("--px", `${(nx * 100).toFixed(1)}%`);
        card.style.setProperty("--py", `${(ny * 100).toFixed(1)}%`);
        // הטיה זעירה בלבד: מספיק כדי להרגיש חומר, לא מספיק כדי להפוך לצעצוע.
        card.style.setProperty("--tilt-y", `${((nx - 0.5) * 3).toFixed(2)}deg`);
        card.style.setProperty("--tilt-x", `${(-(ny - 0.5) * 3).toFixed(2)}deg`);
      });
    };

    const onOut = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(cardSelector);
      if (card) clearCard(card);
    };

    const onDown = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(cardSelector);
      if (!card) return;
      pressed = card;
      card.setAttribute("data-pressed", "");
    };
    const release = () => {
      if (pressed) {
        pressed.removeAttribute("data-pressed");
        pressed = null;
      }
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerout", onOut, { passive: true });
    root.addEventListener("pointerdown", onDown, { passive: true });
    // שחרור נרשם על החלון: אם המשתמש שחרר מחוץ לכרטיס, המצב עדיין מתנקה.
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });

    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerout", onOut);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      if (raf) cancelAnimationFrame(raf);
      release();
      root.querySelectorAll<HTMLElement>(cardSelector).forEach(clearCard);
    };
  }, [ref, cardSelector]);
}
