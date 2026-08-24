"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { homePaths, homePathUi } from "@/content/homePaths";
import type { AskStationId } from "@/content/askRoute";
import { trackEvent } from "@/lib/analytics";

// טעינה עצלה של מנוע ההכוונה: הקוד והתוכן (askRoute.ts) נטענים כ-chunk נפרד רק
// כשמבקר בוחר מצב ורגע-ההקשבה נפתח — לא בטעינת עמוד הבית עצמו. כך ה-Hero לא
// משלם על ה-JS של השיחה, בדיוק כמו במשגר הצף (CompassLauncher).
const AskRoute = React.lazy(() =>
  import("@/components/interactive/AskRoute").then((m) => ({ default: m.AskRoute })),
);

/**
 * רגע-ההקשבה של „איפה אתם נמצאים עכשיו?” — האי-אינטראקטיבי של HomePathSelector.
 *
 * ברירת-המחדל (וגם ה-HTML של ה-SSR / חוויית ללא-JS) היא בדיוק מה שהיה: ארבעה
 * כרטיסי-`<a>` אמיתיים אל עמודי-המסע, וקישור כן „המצב שלי קצת יותר מורכב” אל
 * ‎/compass. זו שכבת ה-SEO והנגישות — Tab מגיע לקישורים, Enter מפעיל אותם, וללא
 * JavaScript הם פשוט מנווטים.
 *
 * מעל השכבה הזו — *שיפור-הדרגתי* בלבד: כשיש JS, לחיצה על מצב אינה מנווטת אלא
 * פותחת את מנוע „שאל את הספר” (AskRoute) *במקום*, מזוהה לאותה תחנה (מדלג על „איפה
 * אתם?” ומתחיל בדילמה). „המצב שלי קצת יותר מורכב” פותח את אותו מנוע מתחילתו —
 * בחירת-המצב הרחבה ביותר. אין כאן AI, אין תיבת-טקסט חופשית ואין ארכיטקטורה חדשה:
 * זהו אותו מנוע דטרמיניסטי שכבר חי ב-‎/compass ובבועה הצפה.
 *
 * כשהשיחה פעילה, הכרטיסים מתקפלים (לא נערמים מתחתיה) והמנוע תופס את מקומם —
 * החוויה נשארת קומפקטית במובייל. סימון `data-ask-inline-active` מאפשר לכלל-CSS
 * להסתיר את הבועה הצפה במובייל בזמן שהשיחה פתוחה, כדי שלא יהיו שתי נקודות-כניסה
 * שיחתיות מתחרות באותו מסך.
 */

type Active =
  | { mode: "station"; station: AskStationId }
  | { mode: "open" }
  | null;

/** לחיצה „רגילה” בלבד נחטפת; Cmd/Ctrl/Shift/Alt או לחצן-אמצע ממשיכים כרגיל
 *  (פתיחת-לשונית וכו') — כדי לא לשבור התנהגות-דפדפן צפויה. */
function isPlainClick(e: React.MouseEvent): boolean {
  return (
    e.button === 0 &&
    !e.defaultPrevented &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  );
}

export function HomePathEntry() {
  const [active, setActive] = React.useState<Active>(null);
  const regionRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLUListElement>(null);
  // מבחין בין הרינדור הראשון (ברירת מחדל, ללא פוקוס) לבין פתיחה/סגירה יזומה.
  const wasActive = React.useRef(false);

  // ניהול פוקוס נגיש: בפתיחה מעבירים פוקוס לאזור-השיחה (קורא-מסך „נוחת” על
  // רגע-ההקשבה, לא נשאר על כרטיס שנעלם); בחזרה מחזירים פוקוס לכרטיס הראשון.
  React.useEffect(() => {
    if (active) {
      const el = regionRef.current;
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "nearest" });
      }
      wasActive.current = true;
    } else if (wasActive.current) {
      wasActive.current = false;
      const firstCard = gridRef.current?.querySelector<HTMLAnchorElement>("a.path-station");
      firstCard?.focus();
    }
  }, [active]);

  const openStation = (station: AskStationId) => {
    trackEvent("ask_open_home", { via: "card", station });
    setActive({ mode: "station", station });
  };
  const openBroad = () => {
    trackEvent("ask_open_home", { via: "complex" });
    setActive({ mode: "open" });
  };

  if (active) {
    return (
      <div className="home-ask mx-auto mt-5 max-w-2xl">
        {/* סמן לכלל-ה-CSS: כל עוד הוא ב-DOM, הבועה הצפה מוסתרת במובייל. */}
        <span data-ask-inline-active hidden aria-hidden="true" />
        <div className="mb-3 flex justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            {homePathUi.backToPaths}
          </button>
        </div>
        <div
          ref={regionRef}
          tabIndex={-1}
          role="region"
          aria-label={homePathUi.conversationLabel}
          className="home-ask__region focus:outline-none"
        >
          <React.Suspense
            fallback={
              <p className="py-10 text-center text-[15px] text-foreground-muted" role="status">
                טוען…
              </p>
            }
          >
            <AskRoute initialStation={active.mode === "station" ? active.station : undefined} />
          </React.Suspense>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="path-choose mx-auto mt-5 max-w-2xl sm:max-w-4xl">
        <ul
          ref={gridRef}
          className="path-stations relative grid grid-cols-1 gap-2.5 sm:grid-cols-4 sm:gap-4"
        >
          {homePaths.map((p, index) => (
            // `contents` — הפריט אינו יוצר תיבה משלו, כך שהקישור עצמו הוא תא
            // הרשת ומקבל את גובה השורה המלא (יעד-מגע גדול, מסלול מיושר).
            <li key={p.id} className="contents">
              <Link
                href={p.stationHref}
                data-index={index}
                onClick={(e) => {
                  // שיפור-הדרגתי: עם JS פותחים שיחה במקום; בלי JS זהו קישור רגיל.
                  if (!isPlainClick(e)) return;
                  e.preventDefault();
                  openStation(p.askStation);
                }}
                className="path-station lift-hover relative flex items-center justify-between gap-2 rounded-xl border-2 border-border bg-surface p-3 text-start transition-colors hover:border-brand/50 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:flex-col sm:items-start sm:gap-3 sm:rounded-2xl sm:p-5"
              >
                {/* צומת התחנה — במרזב-המסלול, מחוץ לגוף הכרטיס, כדי שהקו לא
                    ייחבא מאחורי רקע הכרטיס. דקורטיבי בלבד. */}
                <span className="path-station__node" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-serif text-[15px] font-bold leading-tight text-foreground sm:text-[1.3rem]">
                      {p.buttonTitle}
                    </span>
                    {p.gate ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground sm:text-[12px]">
                        {homePathUi.gateBadge}
                      </span>
                    ) : null}
                  </span>
                  {/* שורת-הזיהוי היא *הסיבה* שהכרטיס אינו כפתור-ניווט: היא
                      מתארת את התחושה, לא את היעד. לכן היא מוצגת גם במובייל. */}
                  <span className="mt-1 block text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[15px]">
                    {p.buttonSub}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="path-arrow inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand transition-colors sm:h-10 sm:w-10 sm:self-end"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* כניסה כנה למי שלא מזהה את עצמו באף מצב. עם JS: פותח את המנוע המודרך
          מתחילתו (בחירת-המצב הרחבה ביותר) במקום. בלי JS: קישור אמיתי אל
          ‎/compass — אותו מנוע. לא „אספר בעצמי”: אין כאן שיחה חופשית ב-V1. */}
      <p className="mx-auto mt-5 max-w-2xl text-center text-[14px] leading-relaxed text-foreground-muted">
        {homePathUi.complexPrompt}{" "}
        <Link
          href="/compass"
          onClick={(e) => {
            if (!isPlainClick(e)) return;
            e.preventDefault();
            openBroad();
          }}
          className="group inline-flex items-center gap-1.5 font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          {homePathUi.complexLabel}
          <ArrowLeft
            className="h-3.5 w-3.5 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </p>
    </>
  );
}
