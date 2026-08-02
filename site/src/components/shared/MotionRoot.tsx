"use client";

import * as React from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/**
 * MotionRoot — האות הגלובלי היחיד ל"תנועה מתקדמת מותרת".
 *
 * מוסיף `motion-js` ל-<html> אך ורק כאשר: JS חי, IntersectionObserver נתמך,
 * והמשתמש אינו מבקש `prefers-reduced-motion: reduce`. כל שכבות התנועה מבוססות-JS
 * (חשיפות Reveal, ובהמשך tilt/parallax/route-draw) מגודרות מאחורי המחלקה הזו,
 * כך שנפילה בטוחה מובנית: ללא JS / הידרציה נכשלת / reduced-motion ⇒ המחלקה לא
 * מתווספת והתוכן נשאר במצבו הסופי הגלוי (ללא הסתרה).
 *
 * מגיב בזמן אמת לשינוי העדפת reduced-motion (מוסיף/מסיר את המחלקה).
 * אינו מרנדר DOM.
 */
export function MotionRoot() {
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const supportsIO = typeof IntersectionObserver !== "undefined";
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    const apply = () => {
      const allowed = supportsIO && !(mq?.matches ?? false);
      root.classList.toggle("motion-js", allowed);
    };

    apply();
    mq?.addEventListener?.("change", apply);
    return () => {
      mq?.removeEventListener?.("change", apply);
      root.classList.remove("motion-js");
    };
  }, []);

  return null;
}
