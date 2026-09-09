"use client";

import * as React from "react";

/**
 * מקדם את כפתור-הרכישה בהדר אחרי שהמבקר עבר את ה-Hero.
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
 * **מה הרכיב הזה אינו עושה:** הוא אינו קובע את המראה ההתחלתי. זה נקבע בשרת
 * דרך `data-cta` (ראו `Header`/`MainNav`), ולכן ה-HTML הראשון כבר נכון ואין
 * שום הבהוב של מלא→שקט אחרי הידרציה. בעמודים שאין בהם `.sig-hero` הרכיב יוצא
 * מיד ואינו נוגע ב-DOM כלל.
 *
 * ללא JS: הכפתור נשאר במראהו מהשרת — בעמוד הבית שקט אך נוכח ולחיץ, ובשאר
 * העמודים בולט. אין מצב שבו הרכישה נעלמת או מאבדת נגישות.
 *
 * המימוש קורא גאומטריה ב-rAF וכותב ל-DOM ישירות — בלי מסלול-רינדור של React,
 * בלי state, ובלי אפשרות לאי-התאמת-הידרציה.
 */
export function HeaderCtaScope() {
  React.useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>(".sig-hero");
    // אין Hero ⇒ אין מה לקדם: השרת כבר רינדר `data-cta="strong"` לעמוד הזה.
    // חשוב שלא נכתוב כאן כלום — כתיבה כזו הייתה משנה מראה אחרי הידרציה.
    if (!hero) return;

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
