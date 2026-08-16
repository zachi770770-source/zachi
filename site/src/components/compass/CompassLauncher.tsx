"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Compass, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { compassQuiz } from "@/content/compass";
import type { AskStationId } from "@/content/askRoute";

// טעינה עצלה של מנוע העוזר: הקוד והנתונים (askRoute.ts) נטענים כ-chunk נפרד רק
// כשהחלונית נפתחת בפועל — לא בטעינת כל עמוד שבו המשגר קיים.
const AskRoute = React.lazy(() =>
  import("@/components/interactive/AskRoute").then((m) => ({
    default: m.AskRoute,
  })),
);

/** נתיב-מסלול → תחנת-עוזר (כדי לא לשאול שוב „איפה אתם?”). */
const PATH_TO_STATION: Record<string, AskStationId> = {
  "/before-relationship": "dating",
  "/building-relationship": "building",
  "/inside-relationship": "existing",
  "/after-breakup": "after-breakup",
};
/** מזהה עמוד-תחנה (ב-`?station=` של /preview) → תחנת-עוזר. */
const STATION_PAGE_TO_ASK: Record<string, AskStationId> = {
  "before-relationship": "dating",
  "building-relationship": "building",
  "inside-relationship": "existing",
  "after-breakup": "after-breakup",
};


/**
 * משגר „שאל את הספר” בעמוד הבית — מנוע ההכוונה הדטרמיניסטי, נגיש תמיד וללא
 * ניווט החוצה. אינו צ׳אטבוט ואינו AI: הבועה פותחת את אותו מנוע (AskRoute) שבעמוד
 * /compass ובבית — 2–3 שאלות סגורות → תחנה + כלי + פעולה, בלי API חיצוני.
 *
 * - Desktop/Tablet (md ומעלה): בועה עגולה קבועה בצד המתחיל-לוגית של הקצה
 *   (שמאל ב-RTL), באמצע גובה המסך, עם תווית קטנה „שאל את הספר”.
 * - Mobile: בועה עגולה צפה באותו צד, במרווח בטוח מעל באנר העוגיות, כדי שלא
 *   תסתיר אותו.
 * - הבועה עדינה ולא-חוסמת: אינה מסתירה CTA/טקסט/פוטר/ניווט/באנרים. כדי להבטיח
 *   זאת גם בקיפול-הראשון (שבו תוכן-Hero יכול להגיע עד תחתית המסך, למשל שורת-התזה
 *   והפעולה הראשית ב-/book), היא מוסתרת מעל ה-Hero ונחשפת ברכות אחרי שהמשתמש גלל
 *   מעברו. הנגישות לעוזר בראש העמוד נשמרת דרך ה-CTA שב-Hero וקישור הניווט.
 */
export function CompassLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  // חשיפה תלוית-גלילה *במובייל בלבד*: שם ה-Hero נערם לרוחב-מלא ויכול להגיע עד
  // תחתית המסך, כך שהגלולה הבתחתית-מתחילה כיסתה תוכן קיפול-ראשון משמעותי ב-/book
  // (שורת-התזה והפעולה הראשית). לכן במובייל היא מוסתרת מעל ה-Hero ונחשפת אחרי
  // גלילה מעברו. בדסקטופ אין חפיפה (הפריסה טורית, הגלולה בפינה) — ושם היא נשארת
  // נוכחת מיד כבעבר. שני הערכים ברירת-מחדל תואמים SSR (לא-מובייל, טרם-גלילה) ⇒
  // אין אי-התאמת-הידרציה; המיקום fixed ⇒ אין CLS.
  const [pastHero, setPastHero] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // ה-CTA שבתוך ה-Hero (מובייל) פותח את אותו drawer דרך אירוע חלון. הפתיחה הזו
  // עובדת גם כשהגלולה עדיין מוסתרת (בקיפול-הראשון) — הנגישות לעוזר נשמרת בראש
  // העמוד דרך ה-CTA שב-Hero ודרך קישור „מה הספר אומר?” בניווט.
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-compass", handler);
    return () => window.removeEventListener("open-compass", handler);
  }, []);

  // מעקב breakpoint (<768px = מובייל) — קובע אם החשיפה תלוית-הגלילה חלה בכלל.
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // סף החשיפה: אחרי ~60% מגובה-המסך (לפחות 320px). מוסתר שוב סמוך לראש העמוד, כך
  // שהקיפול-הראשון במובייל תמיד פנוי מהבקרה הצפה. עדכון ממותג ב-rAF כדי לא להעמיס
  // על הגלילה. מכובד תחת reduced-motion (המעבר מתאפס גלובלית).
  React.useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const threshold = Math.max(320, Math.round(window.innerHeight * 0.6));
      setPastHero(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };
    compute(); // מצב התחלתי (במקרה של שחזור מיקום-גלילה)
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // מוסתרת-ולא-אינטראקטיבית רק כשמובייל *וגם* טרם-גלילה. בדסקטופ תמיד פעילה.
  const hiddenOnFold = isMobile && !pastHero;

  // התחנה הנוכחית — נגזרת ישירות בזמן רינדור מההקשר: בעמוד-מסלול לפי הנתיב;
  // ב-/preview לפי ה-`?station=` שנשא מהמסלול. כך בלחיצה על הבועה המנוע ממשיך
  // מהתחנה הידועה במקום לשאול שוב „איפה אתם?”. הערך אינו מרונדר ל-DOM עד שהחלונית
  // נפתחת, ולכן קריאת `window.location.search` (מוגנת) אינה יוצרת חוסר-התאמת-הידרציה.
  const station = React.useMemo<AskStationId | undefined>(() => {
    if (!pathname) return undefined;
    const byPath = PATH_TO_STATION[pathname];
    if (byPath) return byPath;
    if (pathname === "/preview" && typeof window !== "undefined") {
      const raw = new URLSearchParams(window.location.search).get("station");
      return raw ? STATION_PAGE_TO_ASK[raw] : undefined;
    }
    return undefined;
  }, [pathname]);

  // מובייל: הבועה מורמת מעל בר-הטעימה הדביק (הבר יושב בתחתית ורוחבו כמעט מלא),
  // כך שאין חפיפה בין שני הרכיבים הצפים. בדסקטופ היא בפינה התחתונה-מתחילה
  // (שמאל ב-RTL), הפוך מבר-הטעימה שיושב בפינה הנגדית.
  // מיקום ה-bottom נקבע כ-*inline style* (לא דרך class ב-stylesheet) בכוונה:
  // Chromium אינו מתקף מחדש ערך `bottom` שמגיע מכלל-stylesheet כשמשתנה-CSS
  // *יורש* (כאן `--cookie-banner-height`, שה-CookieConsent קובע על ה-body בעת
  // פתיחת הבאנר) משתנה — אך *כן* מתקף inline style. לכן הגלולה מתרוממת מעל
  // הבאנר מיידית, בלי פיגור ובלי חפיפה. הבסיס הרספונסיבי (`--bubble-bottom”)
  // נקבע דרך class לפי breakpoint (מובייל 5.5rem / דסקטופ 2rem), וההיסט מעל
  // הבאנר נצרך ישירות מהמשתנה היורש. ברירת-מחדל 0px כשאין באנר.
  const bubbleBottom =
    "max(var(--bubble-bottom), calc(var(--cookie-banner-height, 0px) + 16px))";

  // בתוך /compass עצמו העמוד *הוא* המנוע — אין טעם בבועה צפה שמובילה אליו.
  // (ההחזרה מוקדמת אך *אחרי* כל ה-hooks, כדי לא להפר את סדר ה-hooks.)
  if (pathname?.startsWith("/compass")) return null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {/* בועה צפה גדולה עם טקסט מפורש — פינה תחתונה-מתחילה (שמאל ב-RTL) */}
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="מה הספר אומר על המצב שלי?, כמה שאלות קצרות שמובילות אותך לקטע ולכלי המתאימים"
          title="כמה שאלות קצרות, ותדעו מאיזה קטע בספר להתחיל"
          // במובייל-טרם-גלילה הגלולה מוצאת ממסלול-הטאב ומ-AT, כדי שלא תהיה
          // יעד-מגע/פוקוס נסתר מעל תוכן ה-Hero. בדסקטופ היא תמיד פעילה.
          aria-hidden={hiddenOnFold ? true : undefined}
          tabIndex={hiddenOnFold ? -1 : undefined}
          // מצב-החשיפה נמסר כ-data-attribute; כלל-CSS ייעודי (globals.css) מסתיר
          // את הגלולה *רק במובייל* כש-`data-past-hero="false"`. בדסקטופ הכלל אינו
          // חל, ולכן ההתנהגות המיידית נשמרת בדיוק כבעבר.
          data-past-hero={pastHero ? "true" : "false"}
          // ה-bottom נקבע inline (ולא דרך class), אחרת Chromium לא מתקף אותו מחדש
          // כשמשתנה הבאנר היורש משתנה — ואז הגלולה חופפת לבאנר. הבסיס הרספונסיבי
          // (`--bubble-bottom”) מגיע דרך class לפי breakpoint.
          style={{ bottom: bubbleBottom }}
          className={cn(
            // „מצפן הקשר” — לא בועת-צ׳אט. משטח חם (surface) עם מסגרת מרוסנת וצל
            // רך, וסמל-מצפן טרקוטה זהה לזה של עמוד /compass ולראש המגירה, כך
            // שהזהות היא „איפה אני עכשיו?” ולא „פתח צ׳אט”. שקט אך נוכח: לא
            // מתחרה ב-CTA הכהה, לא כבד. הבסיס הרספונסיבי כמשתנה: מובייל 5.5rem
            // (מעל בר-הטעימה), דסקטופ 2rem. „bottom” אינו ב-transition —
            // ההרמה מעל הבאנר מיידית. RTL: end-*.
            "compass-pill group fixed end-4 [--bubble-bottom:max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] top-auto z-40 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface py-2 pe-4 ps-2 text-[14px] font-semibold leading-none text-foreground shadow-[0_10px_30px_-12px_rgba(43,36,31,0.35)] transition-[transform,border-color,opacity] duration-300 hover:-translate-y-0.5 hover:border-brand/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:end-6 md:[--bubble-bottom:2rem] md:pe-5 md:text-[15px]"
          )}
        >
          {/* סמל-המצפן הטרקוטה — הזהות של „מה הספר אומר על המצב שלי”. */}
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand md:h-9 md:w-9"
          >
            <Compass className="h-[18px] w-[18px] md:h-5 md:w-5" />
          </span>
          {/* טקסט מלא בדסקטופ; במובייל נוסח קצר יותר כדי לא לחסום תוכן. */}
          <span className="hidden whitespace-nowrap sm:inline">
            מה הספר אומר על המצב שלי?
          </span>
          <span className="whitespace-nowrap sm:hidden">מה הספר אומר?</span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 end-0 z-50 flex w-[min(94vw,32rem)] flex-col overflow-hidden bg-background shadow-2xl focus:outline-none will-change-transform data-[state=open]:animate-compass-in data-[state=closed]:animate-compass-out"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-start gap-2.5">
              {/* אייקון מצפן קטן — מלווה בלבד, לא הכותרת הראשית. */}
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand"
                aria-hidden="true"
              >
                <Compass className="h-4 w-4" />
              </span>
              <div>
                <DialogPrimitive.Title className="font-serif text-lg font-semibold text-foreground">
                  {compassQuiz.ask.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 max-w-[34ch] text-[13.5px] leading-snug text-foreground-muted">
                  {compassQuiz.ask.subtitle}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="סגירה"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div
            className="grow overflow-y-auto px-5 py-6 sm:px-6"
            // סגירת ה-drawer בעת ניווט מתוך התוצאה: לחיצה על קישור (למשל „לקרוא את
            // הקטע המתאים בספר” → /preview?tool=&station=, או הכלי → /book#tool-…) היא
            // ניווט צד-לקוח דרך <Link>. ה-CompassLauncher חי ב-layout המתמיד, ולכן
            // בלי סגירה מפורשת ה-Dialog נשאר `open` וה-Overlay (fixed inset-0) ממשיך
            // לכסות את העמוד החדש — המשתמש „לא מגיע” לקטע. דלגציה על כל <a> סוגרת את
            // החלונית לכל היעדים, כולל שינוי `?query` בלבד (כבר ב-/preview) שבו הנתיב
            // אינו משתנה. הניווט עצמו אינו נמנע — setOpen(false) רק סוגר במקביל.
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <React.Suspense
              fallback={
                <p className="py-10 text-center text-[15px] text-foreground-muted" role="status">
                  טוען…
                </p>
              }
            >
              <AskRoute initialStation={station} />
            </React.Suspense>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
