"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Fallback לחשיפה בגלילה לדפדפנים שאינם תומכים ב-Scroll-Driven Animations
 * (Safari, Firefox). ב-Chromium יש תמיכה מקורית (animation-timeline: view())
 * ולכן הרכיב יוצא מיד ואינו עושה דבר — האנימציה נשארת CSS-first.
 *
 * עקרונות:
 *  - אין עקיפה של prefers-reduced-motion: אם המשתמש ביקש הפחתת תנועה, לא
 *    מוסיפים את מחלקת ההפעלה כלל, והתוכן נשאר סטטי (גם ה-CSS מכבד זאת).
 *  - בטוח ללא JS: מחלקת „motion-js” מתווספת רק אחרי אימות התנאים; בלעדיה
 *    ה-fallback ב-CSS אינו מסתיר דבר — התוכן גלוי במצבו הסופי.
 *  - ללא הבהוב: אלמנטים שכבר במסך מסומנים כגלויים לפני הפעלת ה-CSS.
 */
const SELECTOR =
  ".reveal, .method-steps, .stations-grid, .route-line, .route-line--v";

export function MotionFallback() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // (1) תמיכה מקורית ב-scroll-driven → אין צורך ב-fallback.
    const supportsView =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: view()");
    if (supportsView) return;

    // (2) כיבוד מלא של הפחתת תנועה — לא מפעילים תנועה כלל.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // (3) IntersectionObserver זמין.
    if (!("IntersectionObserver" in window)) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>(SELECTOR)
    );
    if (els.length === 0) return;

    // סימון מיידי של אלמנטים שכבר במסך כדי למנוע הבהוב מעל הקיפול.
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const pending: HTMLElement[] = [];
    for (const el of els) {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < vh * 0.9 && rect.bottom > 0;
      if (inView) {
        el.classList.add("is-visible");
      } else {
        pending.push(el);
      }
    }

    // רק עכשיו מפעילים את מצב ה-fallback (מסתיר את מה שעדיין לא נחשף).
    document.documentElement.classList.add("motion-js");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    for (const el of pending) io.observe(el);

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
