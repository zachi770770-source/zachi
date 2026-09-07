"use client";

import * as React from "react";

/**
 * #1 „קו-הבנייה” של העמוד — פס טרקוטה דק בקצה-ההתחלה (ימין ב-RTL) שמתמלא לפי
 * התקדמות הקריאה, הד למוטיב „המסלול/הבנייה”. דקורטיבי בלבד (aria-hidden).
 *
 * מונע-JS (ולא native scroll-timeline): ב-body יש overflow-x:hidden שהופך אותו
 * ל-scroll container ומשבש `scroll()`/`view()`; rAF אמין בכל מצב. מפרסם
 * `--build-progress` (0..1) על פס-המילוי; ה-CSS ממפה אותו ל-scaleY (מרוכב,
 * 60fps). מוצג רק כשמותרת תנועה (`.motion-js` ב-globals.css); reduced-motion /
 * no-JS ⇒ נסתר לגמרי, ללא השפעה על הפריסה.
 */
/**
 * ציוני-הדרך הנרטיביים של המסע הראשי, לפי סדר הופעתם. אלה מקטעים שכבר קיימים
 * בעמודים — לא נוצרו כאן — וכל אחד מייצג *שלב בסיפור*: הפתיח, רגע-הזיהוי,
 * התזה „חיפוש → בנייה”, בחירת-המצב, ההסבר „נקודה → מסלול”, והסגירה. מקטע
 * שאינו קיים בעמוד הנוכחי פשוט נעדר מהחישוב.
 */
const PHASES = [
  "#hero, .sig-hero",
  ".recog",
  "#thesis",
  "#path",
  ".s2p",
  ".home-close, #purchase, footer",
] as const;

export function BuildSpine() {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    // גבולות-הפאזות, נמדדים פעם אחת ומחדש רק כשהפריסה משתנה. אחרת כל גלילה
    // הייתה מודדת מחדש ומכריחה layout — כאן הגלילה קוראת מספרים בלבד.
    let bounds: number[] = [];
    const measure = () => {
      const tops: number[] = [];
      for (const sel of PHASES) {
        const el = document.querySelector(sel);
        if (el) tops.push(el.getBoundingClientRect().top + window.scrollY);
      }
      // תמיד עולה, וללא כפילויות — פאזה שאינה קיימת בעמוד פשוט נעדרת.
      bounds = [...new Set(tops)].sort((a, b) => a - b);
    };
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const vh = window.innerHeight || doc.clientHeight;
      const max = doc.scrollHeight - vh;
      const y = window.scrollY || 0;
      let p: number;
      if (bounds.length < 2) {
        // אין די ציוני-דרך (עמוד קצר/לא-מוכר) — נופלים לאחוז-גלילה גולמי.
        p = max > 0 ? y / max : 0;
      } else {
        // ההתקדמות נמדדת ב*פאזות נרטיביות*, לא באחוז-גלילה: כמה תחנות בסיפור
        // כבר נחצו, ועד כמה התקדמנו בתוך התחנה הנוכחית. כך „חצי” על הפס אומר
        // „חצי מהסיפור”, גם כשמקטע אחד ארוך פי כמה מאחר.
        const eye = y + vh * 0.5;
        let i = 0;
        while (i < bounds.length - 1 && eye >= bounds[i + 1]) i++;
        const start = bounds[i];
        const end = i + 1 < bounds.length ? bounds[i + 1] : max + vh;
        const within = end > start ? (eye - start) / (end - start) : 0;
        p = (i + Math.min(1, Math.max(0, within))) / (bounds.length - 1);
      }
      p = Math.min(1, Math.max(0, p));
      // מתפרסם על השורש כדי שגם המילוי וגם ה„ראש” הזוהר יקראו את אותו ערך.
      root.style.setProperty("--build-progress", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      onScroll();
    };
    remeasure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    // גובה-המסמך משתנה כשגופנים/תמונות נטענים או כשנפתח תוכן — הגבולות זזים
    // ואיתם משמעות ההתקדמות, ולכן מודדים מחדש במקום להיתקע על מדידה ראשונה.
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(remeasure) : null;
    ro?.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="build-spine">
      <span className="build-spine__track" />
      <span className="build-spine__fill" />
      <span className="build-spine__head" />
    </div>
  );
}
