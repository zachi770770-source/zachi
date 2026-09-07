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
  mode = "page",
}: {
  children: React.ReactNode;
  className?: string;
  /**
   * "page" (ברירת מחדל) — ההתקדמות נמדדת מראש העמוד. זו התנהגות השער, ולא
   * נגעתי בה. "element" — ההתקדמות נמדדת ממעבר האלמנט עצמו דרך החלון, ולכן
   * מתאימה לאלמנט שיושב באמצע העמוד (למשל דיוקן המחבר).
   */
  mode?: "page" | "element";
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
      let p: number;
      if (mode === "element") {
        // -1..1 סביב מרכז החלון, ואז ממופה ל-0..1. כך אלמנט באמצע העמוד
        // מקבל עומק סימטרי בכניסה וביציאה במקום להיצמד לראש המסמך.
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const rel = (center - vh / 2) / (vh / 2 + r.height / 2);
        p = Math.min(1, Math.max(0, (rel + 1) / 2));
      } else {
        p = Math.min(1, Math.max(0, (window.scrollY || 0) / (vh * 0.7)));
      }
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
  }, [mode]);

  return (
    <div
      ref={ref}
      className={className}
      /* ערך-המנוחה תלוי-מצב, וזה מהותי: ב-"page" הטווח הוא 0→1 מראש העמוד,
         ולכן 0 = „טרם גללנו” = ללא הזזה. ב-"element" הטווח סימטרי סביב מרכז
         החלון, ולכן *0.5* הוא המרכז — כלומר ללא הזזה. עם 0 גם כאן, האלמנט
         ישב מוזז בקצה-הטווח כל עוד ה-JS לא כתב: כך הדיוקן נשאר מוזז 40px
         תחת תנועה-מופחתת ובמצביע גס, שם ה-effect יוצא מוקדם ואינו כותב כלל.
         נמדד ותוקן. */
      style={
        { "--hero-parallax": mode === "element" ? 0.5 : 0 } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
