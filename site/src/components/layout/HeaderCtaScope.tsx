"use client";

import * as React from "react";

/**
 * קובע מתי כפתור-הרכישה בהדר נעשה דומיננטי.
 *
 * הכלל: **פעולה ראשית אחת בכל מסך** — וזה חל גם על ההדר. בצביעה הראשונה של
 * עמוד הבית היו שני כפתורים מלאים ובולטים באותה מידה: „קראו טעימה” ב-Hero
 * ו„לרכישת הספר” בהדר. שניהם דורשים החלטה, ורק אחד מהם נכון בשלב הזה —
 * מבקר שהגיע לפני שנייה עדיין לא יודע מה הספר, ולכן הטעימה (סיכון אפס) היא
 * הפעולה, והרכישה יכולה לחכות.
 *
 * לכן: כל עוד ה-Hero על המסך, כפתור-הרכישה שקט (מתאר, לא מלא). ברגע שהמבקר
 * עבר את ה-Hero — כלומר נכנס לשקילת-מוצר — הוא נעשה מלא ובולט. הרכישה נגישה
 * בכל רגע; רק המשקל החזותי משתנה.
 *
 * בעמודים שאין בהם `.sig-hero` (כלומר כל עמוד שאינו הבית) המבקר כבר בשקילה,
 * ולכן הכפתור בולט מיד.
 *
 * המימוש קורא גאומטריה ב-rAF וכותב ל-DOM ישירות — בלי מסלול-רינדור של React,
 * בלי state, ובלי אפשרות לאי-התאמת-הידרציה. ברירת-המחדל ב-SSR היא „בולט”,
 * כדי שללא JS הרכישה לעולם לא תישאר במצב השקט.
 */
export function HeaderCtaScope() {
  React.useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>(".sig-hero");
    if (!hero) {
      root.setAttribute("data-past-hero", "");
      return () => root.removeAttribute("data-past-hero");
    }

    let raf = 0;
    const compute = () => {
      raf = 0;
      const headerH =
        parseInt(
          getComputedStyle(root).getPropertyValue("--header-height"),
          10,
        ) || 64;
      // „עברנו את ה-Hero” = תחתית ה-Hero חלפה מתחת לשולי ההדר.
      root.toggleAttribute(
        "data-past-hero",
        hero.getBoundingClientRect().bottom <= headerH,
      );
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };

    compute(); // שחזור מיקום-גלילה / deep-link
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(hero);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
      root.removeAttribute("data-past-hero");
    };
  }, []);

  return null;
}
