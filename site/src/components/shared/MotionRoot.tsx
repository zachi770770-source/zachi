"use client";

import * as React from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/**
 * MotionRoot — האות הגלובלי ל"תנועה מתקדמת מותרת" + בקר החשיפה הגלובלי.
 *
 * מוסיף `motion-js` ל-<html> אך ורק כאשר: JS חי, IntersectionObserver נתמך,
 * והמשתמש אינו מבקש `prefers-reduced-motion: reduce`. רק אז ה-CSS מסתיר זמנית
 * `.reveal` (opacity:0) — ולכן נדרש בקר שיחשוף אותו.
 *
 * בקר החשיפה (רץ רק כשמותרת תנועה):
 *  - חושף מיד כל `.reveal` שנמצא בתוך אזור התצוגה או מעליו (מעל-הקיפול,
 *    reload בגלילה, deep-link) — כך תוכן חשוב לעולם אינו „תקוע” נסתר.
 *  - חושף בגלילה, דרך IntersectionObserver יחיד, כל `.reveal` שמתחת לקיפול.
 *  - סורק גם תוכן שנוסף דינמית (MutationObserver, מקובץ ב-rAF).
 *  - fail-safe: אחרי מספר שניות חושף כל `.reveal` שנותר נסתר — הבטחה שקופי או
 *    CTA משמעותי לא יישאר בלתי-נראה גם אם משהו נכשל.
 *
 * נפילה בטוחה מובנית: ללא JS / הידרציה נכשלת / reduced-motion ⇒ `motion-js` לא
 * מתווסף, ה-CSS אינו מסתיר דבר, והתוכן גלוי במלואו מיד. אינו מרנדר DOM.
 */
export function MotionRoot() {
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const supportsIO = typeof IntersectionObserver !== "undefined";
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    let io: IntersectionObserver | null = null;
    let buildIo: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    let failsafe = 0;
    let rafScan = 0;

    const reveal = (el: Element) => el.classList.add("is-visible");

    // #6 „בניית משפט” — הדגשת המשפטים החזקים: חימוש (מסכה) + פוקוס בכניסה
    // לתצוגה. אמין ב-body עם overflow-x:hidden (שם native scroll-timeline נכשל).
    const focusBuild = (el: Element) => el.classList.add("is-focused");
    const setupBuildText = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll<HTMLElement>(".build-text:not(.is-focused)").forEach((el) => {
        if (!el.classList.contains("is-armed")) el.classList.add("is-armed");
        // הגיע לאזור קריאה נוח (כולל מעל-הקיפול/deep-link) ⇒ פוקוס. נקרא גם
        // בכל גלילה (גיבוי ל-IO) ⇒ „הגיע לתצוגה ⇒ נבנה”, לעולם לא תקוע מוסתר.
        if (el.getBoundingClientRect().top < vh * 0.78) focusBuild(el);
        else buildIo?.observe(el);
      });
    };

    const inOrAboveView = (el: Element) => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      return el.getBoundingClientRect().top < vh;
    };

    const process = (el: Element) => {
      if (el.classList.contains("is-visible")) return;
      if (inOrAboveView(el)) reveal(el);
      else io?.observe(el);
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)").forEach(process);
      if (buildIo) setupBuildText();
    };

    // גיבוי מגודר-מיקום: חושף אך ורק רכיבים ש*מצטלבים כרגע* עם אזור-הצפייה
    // (חלק כלשהו גלוי) ונשארו מוסתרים — race נדיר של IO. רכיב מתחת-לקיפול
    // (top ≥ גובה-החלון) לעולם אינו נחשף כאן: הוא ממתין לגלילה (IO/scan).
    const revealStuckInView = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.is-visible)")
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) reveal(el);
        });
      document
        .querySelectorAll<HTMLElement>(".build-text.is-armed:not(.is-focused)")
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0) focusBuild(el);
        });
    };

    const scheduleScan = () => {
      if (rafScan) return;
      rafScan = window.requestAnimationFrame(() => {
        rafScan = 0;
        scan();
      });
    };

    const startController = () => {
      if (io) return;
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              reveal(e.target);
              io?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      buildIo = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              focusBuild(e.target);
              buildIo?.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.55 }
      );
      scan();
      setupBuildText();
      mo = new MutationObserver(scheduleScan);
      mo.observe(document.body, { childList: true, subtree: true });
      // גיבוי ל-IO: בכל גלילה/שינוי-גודל סורקים שוב וחושפים כל .reveal שהגיע
      // לתצוגה — מבטיח „הגיע לתצוגה ⇒ נראה” גם בקצוות שה-IO עלול לפספס.
      window.addEventListener("scroll", scheduleScan, { passive: true });
      window.addEventListener("resize", scheduleScan);
      // fail-safe *כשל-אמיתי בלבד* — לא טיימר גלובלי לפי-זמן. אחרי השהיה קצרה
      // חושפים אך ורק רכיבים שכבר נמצאים בתוך/קרוב לאזור-הצפייה אך נשארו
      // מוסתרים (race נדיר שבו callback ה-IO לא נורה על אלמנט שכבר בתצוגה
      // בטעינה/הידרציה). רכיב רחוק מתחת-לקיפול לעולם אינו נחשף לפי זמן — הוא
      // ממתין ל-IntersectionObserver/scan כשגוללים אליו (גם אחרי 10–20ש בשער).
      failsafe = window.setTimeout(revealStuckInView, 1200);
    };

    const stopController = () => {
      io?.disconnect();
      io = null;
      buildIo?.disconnect();
      buildIo = null;
      mo?.disconnect();
      mo = null;
      window.removeEventListener("scroll", scheduleScan);
      window.removeEventListener("resize", scheduleScan);
      if (failsafe) {
        clearTimeout(failsafe);
        failsafe = 0;
      }
      if (rafScan) {
        cancelAnimationFrame(rafScan);
        rafScan = 0;
      }
    };

    const apply = () => {
      const allowed = supportsIO && !(mq?.matches ?? false);
      if (allowed) {
        try {
          root.classList.add("motion-js");
          startController();
        } catch {
          // כשל-אמיתי באתחול הבקר (חריגת JS) → משחזרים למצב גלוי-מלא: מסירים
          // motion-js כך שה-CSS אינו מסתיר עוד אף .reveal (item 3).
          stopController();
          root.classList.remove("motion-js");
        }
      } else {
        root.classList.remove("motion-js"); // בסיס: כל .reveal גלוי ממילא
        stopController();
      }
    };

    apply();
    mq?.addEventListener?.("change", apply);
    return () => {
      mq?.removeEventListener?.("change", apply);
      stopController();
      root.classList.remove("motion-js");
    };
  }, []);

  return null;
}
