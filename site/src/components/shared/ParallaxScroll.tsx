"use client";

import * as React from "react";

/**
 * ParallaxScroll — עומק מרוסן מונע-גלילה לשער. מפרסם משתנה CSS
 * `--hero-parallax` (0 בראש העמוד → ~1 אחרי גלילה של גובה-חלון) על אלמנט
 * העטיפה; שכבות צאצא (הכריכה, ההילה) צורכות אותו דרך
 * `transform: translateY(calc(var(--hero-parallax) * Npx))` ⇒ הן נעות בקצב שונה
 * ונוצר עומק/פרלקסה.
 *
 * בטוח-ביצועים ונגישות (דרישות קשיחות):
 * - פועל רק עם מצביע עדין (עכבר) וללא `prefers-reduced-motion` — במגע/תנועה
 *   מופחתת המשתנה נשאר 0 (אין פרלקסה, אין עלות).
 * - ההאזנה `passive` ומקובצת ב-`requestAnimationFrame` (עדכון אחד לפריים).
 * - `transform` בלבד ⇒ מרוכב ב-compositor, ללא reflow.
 * - ברירת מחדל 0 בראש העמוד ⇒ אין הזזה ואין „קפיצה” ב-first-paint.
 * - ללא JS / הידרציה נכשלת ⇒ המשתנה 0 והמראה זהה לסטטי.
 */
export function ParallaxScroll({
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
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const fine = window.matchMedia?.("(pointer: fine)").matches ?? true;
    if (reduce || !fine) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight || document.documentElement.clientHeight || 1;
      // 0 בראש העמוד, גדל עד 1 לאחר גלילה של ~70% מגובה החלון (בעוד השער נראה),
      // כדי שהעומק יהיה מורגש בזמן שהכריכה עדיין בתצוגה. השער תמיד בראש העמוד,
      // ולכן scrollY ממפה ישירות „כמה השער נגלל למעלה”.
      const p = Math.min(1, Math.max(0, (window.scrollY || 0) / (vh * 0.7)));
      el.style.setProperty("--hero-parallax", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ "--hero-parallax": 0 } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
