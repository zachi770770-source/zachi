"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * „מעבר לספר” (PHASE 4B): קישור רגיל ל-/book או /preview, עם שדרוג-הדרגתי
 * למעבר View Transitions מרוסן — מסכת-דף Ivory (clip-path). כאשר מוגדר
 * `morphCover` והמקור נראה בתצוגה, גם עטיפת הספר „נמשכת ומשתנה גודל” אל היעד:
 * המקור ([data-vt-book-source]) מקבל שם-מעבר משותף בזמן ריצה, והיעד
 * ([data-vt-book-dest]) מקבל אותו דרך CSS (html.vt-book-morph) — כך אין תלות
 * ב-requestAnimationFrame בתוך callback המעבר, והצילום של עמוד היעד נתפס נכון.
 *
 * שמירה על סמנטיקת הקישור: מחזיר <Link> אמיתי (prefetch, Cmd/Ctrl+קליק,
 * „פתח בכרטיסייה חדשה”, Back, גרירה). המעבר המונפש רץ רק בלחיצה שמאלית רגילה,
 * כשה-API נתמך ואין reduced-motion. אחרת — ניווט רגיל מיידי.
 */

const REDUCED = "(prefers-reduced-motion: reduce)";
const VT_NAME = "book-cover";

type Doc = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => {
    finished: Promise<void>;
  };
};

/** האם מרכז האלמנט נמצא בתוך אזור התצוגה בצורה נוחה (למקור „נמשך”). */
function isComfortablyInView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const mid = r.top + r.height / 2;
  return mid > vh * 0.06 && mid < vh * 0.94;
}

function runTransition(
  router: ReturnType<typeof useRouter>,
  href: string,
  morphCover: boolean,
  anchorMidY: number
): void {
  const doc = document as Doc;
  const root = document.documentElement;

  // מקור: מבין העטיפות המסומנות שנמצאות בתוך התצוגה — הקרובה ביותר ל-CTA
  // שנלחץ (כך שכל CTA „מרים” את העטיפה שלצדו, לא עטיפה רחוקה). רק ב-morphCover.
  let source: HTMLElement | null = null;
  if (morphCover) {
    const inView = Array.from(
      document.querySelectorAll<HTMLElement>("[data-vt-book-source]")
    ).filter(isComfortablyInView);
    let best = Infinity;
    for (const el of inView) {
      const r = el.getBoundingClientRect();
      const dist = Math.abs(r.top + r.height / 2 - anchorMidY);
      if (dist < best) {
        best = dist;
        source = el;
      }
    }
  }
  const doMorph = !!source;
  if (source) source.style.viewTransitionName = VT_NAME;

  root.classList.add("vt-book-nav");
  if (doMorph) root.classList.add("vt-book-morph");

  const target = new URL(href, window.location.href).pathname;

  // המתנה לניווט דרך setTimeout (מקרו-משימות ממשיכות לרוץ בזמן ה-callback,
  // בשונה מ-requestAnimationFrame שמושהה בשלב הצילום).
  const settle = (): Promise<void> =>
    new Promise((resolve) => {
      router.push(href);
      let tries = 0;
      const tick = () => {
        if (window.location.pathname === target || tries++ > 90) {
          // שהות קצרה כדי שעמוד היעד יעבור layout לפני הצילום של המצב החדש.
          setTimeout(resolve, 32);
        } else {
          setTimeout(tick, 16);
        }
      };
      tick();
    });

  const restore = () => {
    root.classList.remove("vt-book-nav", "vt-book-morph");
    if (source) source.style.viewTransitionName = "";
  };

  const vt = doc.startViewTransition!(settle);
  vt.finished.then(restore, restore);
}

export type BookLinkProps = React.ComponentProps<typeof Link> & {
  /** האם „להרים” את עטיפת הספר אל היעד (יעד עם [data-vt-book-dest]). */
  morphCover?: boolean;
};

export const BookLink = React.forwardRef<HTMLAnchorElement, BookLinkProps>(
  function BookLink({ href, onClick, morphCover = false, ...rest }, ref) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      // רק לחיצה שמאלית רגילה, ללא מקשי-משנה, ולא „פתח בכרטיסייה חדשה”.
      if (
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        (rest.target && rest.target !== "_self")
      ) {
        return;
      }
      const doc = document as Doc;
      if (typeof doc.startViewTransition !== "function") return; // דפדפן לא נתמך
      if (window.matchMedia?.(REDUCED).matches) return; // כיבוד reduced-motion
      const url = typeof href === "string" ? href : href.toString();
      const ar = e.currentTarget.getBoundingClientRect();
      e.preventDefault();
      runTransition(router, url, morphCover, ar.top + ar.height / 2);
    };

    return <Link ref={ref} href={href} onClick={handleClick} {...rest} />;
  }
);
