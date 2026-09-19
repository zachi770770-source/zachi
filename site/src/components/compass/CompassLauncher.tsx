"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";

import { isEnglishPath } from "@/lib/language";

/**
 * „שאל את הספר” — משגר צף גלובלי אל ‎/compass‎.
 *
 * ── מה שוחזר, ומה לא ─────────────────────────────────────────────────────
 * הרכיב הזה הוסר ב-‎5d9eb82‎, והגרסה ההיא נשאה *שתי* התנהגויות: ענף שמנווט
 * אל ‎/compass‎, וענף שפותח מגירת-Dialog עם מנוע ‎AskRoute‎ טעון-עצלן בתוכה.
 * כאן שוחזר **רק ענף הניווט**, משלוש סיבות:
 *
 *   1. הטקסט הנדרש הוא „שאל את הספר” בדיוק — וזה היה הניסוח של ענף-הניווט.
 *      ענף-המגירה נשא „מה הספר אומר על המצב שלי?”.
 *   2. המגירה שכפלה את חוויית ‎/compass‎ בתוך שכבה צפה: אותו מנוע, ממשק שני.
 *      עכשיו יש מימוש אחד, והבועה היא נקודת-כניסה בלבד.
 *   3. בלי המגירה נופלים גם ‎Dialog‎, ‎flushSync‎, הטעינה-העצלנית, מאזין
 *      ‎open-compass‎, מיפוי-התחנות ומצב-הפתיחה — כלומר הרבה קוד שקיים רק
 *      בשביל ממשק שני שאיננו רוצים.
 *
 * ── מתי הוא מרונדר ───────────────────────────────────────────────────────
 * **בכל עמוד עברי ציבורי**, פרט לשלושה מקרים:
 *   • ‎/compass‎ — שם העמוד *הוא* החוויה; בועה שמובילה אליו היא רעש.
 *   • ‎/en…‎     — מנוע-ההכוונה עברי בלבד. בועה עברית על עמוד אנגלי היא בדיוק
 *                 ה-UI-העברי-האקראי שיש להימנע ממנו, ובועה אנגלית שפותחת
 *                 תוכן עברי הייתה מטעה.
 *   • ‎/admin‎   — לא דרך הרכיב אלא דרך ‎SiteChrome‎, שעוטף אותו.
 *
 * ‎/preview‎ *כלול* — גם במובייל. בסבב קודם הוחרג שם במובייל, מפני שבדיקה
 * ישנה אסרה כל שכבה צפה בעמוד-הטעימה. דרישת-המוצר הנוכחית גוברת על אותה
 * בדיקה, והיא עודכנה במכוון (‎e2e/preview.spec.ts‎): מותרים שם סרגל-הקורא
 * והמשגר המאושר — ושום שכבה צפה אחרת. אין התנגשות גיאומטרית: סרגל-הקורא
 * הוא ‎sticky‎ בראש המסך (‎top: var(--header-height)‎) והמשגר ‎fixed‎ בתחתיתו.
 *
 * **אינו תלוי בדגלי-התכונה.** ‎COMPASS_ASSISTANT_ENABLED‎ ו-
 * ‎COMPASS_FREE_TEXT_UI_PREVIEW‎ קובעים מה ‎/compass‎ *מציג* (טקסט-חופשי מול
 * המנוע המודרך), ו-‎/compass‎ מחליט זאת בעצמו בשרת. הבועה רק מנווטת לשם, ולכן
 * אינה יכולה לחשוף ממשק מגודר: כשהדגלים כבויים הנוחת מקבל את המנוע המודרך,
 * בדיוק כמו מכל קישור אחר אל העמוד. גידור הבועה עצמה היה מסתיר גם את המנוע
 * המודרך — שהוא תכונה מוגמרת ומקושרת מהפוטר.
 *
 * ── מיקום ─────────────────────────────────────────────────────────────────
 * ‎--fab-bottom‎ כבר מוגדר ב-‎globals.css‎ (מובייל 5.5rem, דסקטופ 2rem, מכבד
 * ‎safe-area-inset-bottom‎) ומשמש גם לטווח-הנחיתה של הפוטר — כך שמיקום הבועה
 * והריווח שמתחתיה לא יכולים להיפרד.
 *
 * ה-‎bottom‎ נכתב כ-inline style ולא דרך מחלקה, וזו אינה קפריזה: Chromium אינו
 * מתקף מחדש ערך ‎bottom‎ שמגיע מכלל-stylesheet כאשר משתנה-CSS *יורש* משתנה —
 * וכאן ‎--cookie-banner-height‎ נקבע על ה-‎body‎ בזמן ריצה בידי ‎CookieConsent‎.
 * ב-inline style ההרמה מעל הבאנר מיידית, ולכן אין רגע שבו השניים חופפים.
 */
export function CompassLauncher() {
  const pathname = usePathname();

  /**
   * במובייל בלבד: הבועה מוסתרת מעל ה-Hero ונחשפת אחרי גלילה.
   *
   * זו לא קישוטיות. בקיפול-הראשון במובייל תוכן ה-Hero נערם לרוחב מלא ומגיע עד
   * תחתית המסך, ובועה בפינה התחתונה מכסה שם פעולה ראשית (נמדד ב-‎/book‎).
   * בדסקטופ הפריסה טורית ואין חפיפה, ולכן שם היא נוכחת מיד.
   *
   * שני ערכי-ההתחלה תואמים SSR (לא-מובייל, טרם-גלילה) ⇒ אין אי-התאמת-הידרציה.
   * המיקום ‎fixed‎ ⇒ אין CLS.
   */
  const [pastHero, setPastHero] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    let raf = 0;
    let current: boolean | null = null;
    const compute = () => {
      raf = 0;
      const threshold = Math.max(320, Math.round(window.innerHeight * 0.6));
      const next = window.scrollY > threshold;
      if (next === current) return;
      current = next;
      setPastHero(next);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };
    compute(); // מצב התחלתי, למקרה של שחזור מיקום-גלילה
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // ההחזרות המוקדמות באות *אחרי* כל ה-hooks, כדי לא להפר את סדרם.
  if (pathname?.startsWith("/compass")) return null;
  if (isEnglishPath(pathname)) return null;

  const hiddenOnFold = isMobile && !pastHero;

  return (
    <Link
      href="/compass"
      aria-label="שאל את הספר, כמה שאלות קצרות שמובילות אל הקטע והכלי המתאימים"
      title="שאל את הספר"
      // מוסתרת-ולא-אינטראקטיבית רק במובייל-טרם-גלילה: לא יעד-מגע ולא יעד-פוקוס
      // נסתר מעל תוכן ה-Hero. בדסקטופ תמיד פעילה.
      aria-hidden={hiddenOnFold ? true : undefined}
      tabIndex={hiddenOnFold ? -1 : undefined}
      style={{
        bottom: "max(var(--fab-bottom), calc(var(--cookie-banner-height, 0px) + 16px))",
        opacity: hiddenOnFold ? 0 : 1,
        pointerEvents: hiddenOnFold ? "none" : undefined,
      }}
      className="group fixed end-4 top-auto z-40 inline-flex items-center gap-2.5 rounded-full border border-border-strong bg-surface py-2.5 pe-5 ps-2.5 text-[15.5px] font-semibold leading-none text-foreground shadow-[0_18px_44px_-14px_rgb(var(--shadow-tint)/0.45)] transition-[transform,border-color,opacity] duration-300 hover:-translate-y-0.5 hover:border-secondary/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none md:end-6 md:gap-3 md:py-3 md:pe-7 md:ps-3 md:text-[17px]"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand md:h-12 md:w-12"
      >
        <Compass className="h-5 w-5 md:h-[22px] md:w-[22px]" />
      </span>
      <span className="whitespace-nowrap">שאל את הספר</span>
    </Link>
  );
}
