"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowRight, Compass, MessageCircle, PenLine } from "lucide-react";

import { homePaths, homePathUi, type HomePathId } from "@/content/homePaths";
import type { AskStationId } from "@/content/askRoute";
import { trackEvent } from "@/lib/analytics";
import { withViewTransition } from "@/lib/motion/viewTransition";

// טעינה עצלה של רגע-ההקשבה: קוד השיחה (+ askRoute.ts) נטען כ-chunk נפרד רק כשמבקר
// מתחיל שיחה — לא בטעינת עמוד הבית עצמו, כדי שה-Hero לא ישלם על ה-JS של השיחה.
const HomeConversation = React.lazy(() =>
  import("@/components/sections/HomeConversation").then((m) => ({
    default: m.HomeConversation,
  })),
);

// Focus Mode — חוויית „איפה זה פוגש אותך עכשיו?”. גם היא chunk נפרד: התוכן
// (focusMode.ts, ודרכו methods.ts) נטען רק כשמצב-מוכר נבחר, לא בטעינת העמוד.
const FocusMode = React.lazy(() =>
  import("@/components/focus/FocusMode").then((m) => ({ default: m.FocusMode })),
);

/**
 * רגע-ההקשבה של „איפה אתם נמצאים עכשיו?” — האי-אינטראקטיבי של HomePathSelector.
 *
 * המקטע מורכב מחדש כשיחה, לא כשאלון: קודם *תיבת-כתיבה חופשית* גדולה ורגועה
 * („ספרו לי מה קורה אצלכם…”) כנקודת-הכניסה הראשית, ורק מתחתיה — כחלופה שקטה —
 * ארבעה מצבים מוכרים כפותחי-שיחה (בלי חיצי-ניווט, בלי „מסלול/צמתים”, בלי בקרות
 * שנראות כמו טופס).
 *
 * שכבת בסיס (SSR / ללא-JS / SEO): התיבה החופשית והכרטיסים נשארים `<a>` אמיתיים
 * — התיבה אל ‎/compass, הכרטיסים אל עמודי-המסע. עם JS זהו שיפור-הדרגתי: לחיצה
 * פותחת את מנוע „שאל את הספר” *במקום*, בלי לנווט. אין כאן ארכיטקטורה חדשה —
 * אותו מנוע דטרמיניסטי + השיחה החיה (HomeConversation).
 *
 * הבועה הצפה: כל עוד המקטע נמצא באמת בתוך המסך (IntersectionObserver → הסמן
 * `data-path-in-view`), הבועה „שאל את הספר” מוסתרת במובייל — כדי שלא יהיו שתי
 * הזמנות מתחרות לדבר עם הספר באותו מסך. כשגוללים משם, היא חוזרת כרגיל.
 */

type Active =
  | { mode: "focus"; situation: HomePathId; station: AskStationId }
  | { mode: "station"; station: AskStationId }
  | { mode: "open" }
  | null;

/** לחיצה „רגילה” בלבד נחטפת; Cmd/Ctrl/Shift/Alt או לחצן-אמצע ממשיכים כרגיל. */
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

export function HomePathEntry({
  freeTextEnabled = false,
}: {
  /**
   * מצב-התצוגה (נקבע בשרת ב-`HomePathSelector`): כשהכתיבה-החופשית חיה, התיבה
   * הראשית היא באמת שדה-כתיבה — סמן מהבהב, אייקון עֵט, ורמז „אפשר לכתוב…”.
   * כשברירת המחדל פעילה (המצפן המודרך בלבד), לחיצה פותחת שיחה מודרכת קצרה ולא
   * שדה-כתיבה, ולכן האפורדנס הופך כן: אייקון מצפן (זהות „שאל את הספר”), בלי סמן-
   * כתיבה, ורמז שמתאר את המהלך המודרך — כדי לא להבטיח הקלדה שאינה מתקיימת עדיין.
   * ברירת מחדל `false` = ההתנהגות בפרודקשן.
   */
  freeTextEnabled?: boolean;
}) {
  const [active, setActive] = React.useState<Active>(null);
  const [inView, setInView] = React.useState(false);
  // המצב שנלחץ — כותרתו נושאת `view-transition-name: fm-title` כדי שתתמזג
  // (morph) מהכרטיס אל כותרת-הבמה של Focus Mode, במקום „להיעלם”.
  const [morphId, setMorphId] = React.useState<HomePathId | null>(null);
  const regionRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<HTMLUListElement>(null);
  const wasActive = React.useRef(false);

  // ניהול פוקוס נגיש: בפתיחה מעבירים פוקוס לאזור-השיחה; בחזרה — לכרטיס הראשון.
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
      gridRef.current?.querySelector<HTMLAnchorElement>("a.situation-card")?.focus();
    }
  }, [active]);

  // נוכחות-המקטע-במסך: מסמן `data-path-in-view` כל עוד `#path` באמת בתוך המסך,
  // כדי שכלל-CSS יסתיר את הבועה הצפה במובייל (אין שתי הזמנות מתחרות). מבוסס
  // נראוּת בפועל (IntersectionObserver) ולא היסט-פיקסלים קשיח.
  React.useEffect(() => {
    const section = document.getElementById("path");
    if (!section || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { rootMargin: "-15% 0px -20% 0px", threshold: 0 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // בחירת מצב-מוכר פותחת קודם את Focus Mode (הבמה של „עובדה מול סיפור”), לא את
  // השיחה עצמה. אירוע „שיחה נפתחה” (`ask_open_home`) נשמר למעבר לשיחה בפועל
  // (`openStation` מתוך ה-CTA של Focus Mode), כדי שמשמעות המדד לא תשתנה.
  const openFocus = (situation: HomePathId, station: AskStationId) => {
    // מסמנים את הכרטיס הנלחץ לפני צילום-ה-VT, כדי שכותרתו תתמזג אל הבמה.
    flushSync(() => setMorphId(situation));
    withViewTransition(() =>
      flushSync(() => setActive({ mode: "focus", situation, station })),
    );
  };
  const openStation = (station: AskStationId) => {
    trackEvent("ask_open_home", { via: "card", station });
    withViewTransition(() => flushSync(() => setActive({ mode: "station", station })));
  };
  const openBroad = () => {
    trackEvent("ask_open_home", { via: "composer" });
    withViewTransition(() => flushSync(() => setActive({ mode: "open" })));
  };
  const closeActive = () => {
    withViewTransition(() => flushSync(() => setActive(null)));
  };

  // כל עוד המקטע במסך — הבועה הצפה מוסתרת (מובייל). קיים גם `data-ask-inline-active`
  // לזמן שיחה פעילה, כגיבוי מפורש למצב שבו המקטע נגלל אך השיחה עדיין פתוחה.
  const inViewMarker = inView ? (
    <span data-path-in-view hidden aria-hidden="true" />
  ) : null;

  // Focus Mode — הבמה של „עובדה מול סיפור” למצב שנבחר. הרכיב נושא בעצמו את
  // כפתור-החזרה ואת אזור-ה-region; ה-CTA „המשיכו עם הספר” ממשיך אל השיחה.
  if (active?.mode === "focus") {
    return (
      <>
        {inViewMarker}
        <span data-ask-inline-active hidden aria-hidden="true" />
        <React.Suspense
          fallback={
            <p className="mt-6 py-10 text-center text-[15px] text-foreground-muted" role="status">
              טוען…
            </p>
          }
        >
          <FocusMode
            key={active.situation}
            situationId={active.situation}
            onContinue={() => openStation(active.station)}
            onBack={closeActive}
          />
        </React.Suspense>
      </>
    );
  }

  if (active) {
    return (
      <div className="home-ask mx-auto mt-6 max-w-2xl">
        {inViewMarker}
        <span data-ask-inline-active hidden aria-hidden="true" />
        <div className="mb-3 flex justify-center sm:justify-start">
          <button
            type="button"
            onClick={closeActive}
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
            <HomeConversation station={active.mode === "station" ? active.station : undefined} />
          </React.Suspense>
        </div>
      </div>
    );
  }

  return (
    <>
      {inViewMarker}

      {/* ── נקודת-הכניסה הראשית: תיבת-כתיבה חופשית ── גדולה, רגועה, וברור שאפשר
          להקליד בה (סמן מהבהב + כיתוב-placeholder + אייקון עֵט). אפורדנס אמיתי:
          לחיצה/פוקוס פותחים את השיחה הרחבה במקום; בלי JS — קישור אל ‎/compass.
          לא כפתור-CTA כהה: זו האינטראקציה החזקה במקטע, אך שקטה. */}
      <div className="mx-auto mt-6 max-w-2xl">
        <Link
          href="/compass"
          aria-label={homePathUi.composerAriaLabel}
          onClick={(e) => {
            if (!isPlainClick(e)) return;
            e.preventDefault();
            openBroad();
          }}
          className="home-composer group flex w-full items-center gap-3 rounded-2xl border border-border-strong bg-surface px-5 py-4 text-start shadow-sm transition-[border-color,box-shadow] hover:border-brand/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-6 sm:py-5"
        >
          {/* סמן-הכתיבה המהבהב הוא „אפשר להקליד כאן” — נכון רק כשהכתיבה-החופשית
              חיה. במצב המודרך התיבה פותחת שיחה מודרכת, ולכן הסמן אינו מוצג כדי
              לא להבטיח הקלדה. */}
          {freeTextEnabled ? (
            <span aria-hidden="true" className="home-composer__caret" />
          ) : null}
          <span className="min-w-0 flex-1 text-[16.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[18px]">
            {homePathUi.composerLead}
          </span>
          {/* אייקון: עֵט (כתיבה) כשהכתיבה-החופשית חיה; אחרת מצפן — זהות „שאל את
              הספר” העקבית עם ה-CompassLauncher ועם מקטע התחנות. */}
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground sm:h-10 sm:w-10"
          >
            {freeTextEnabled ? (
              <PenLine className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            ) : (
              <Compass className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            )}
          </span>
        </Link>
        <p className="mt-2 px-1 text-[13px] leading-relaxed text-foreground-muted">
          {freeTextEnabled ? homePathUi.composerHint : homePathUi.composerHintGuided}
        </p>
      </div>

      {/* ── מפריד שקט אל המצבים המוכרים ── */}
      <div className="mx-auto mt-7 flex max-w-2xl items-center gap-3 sm:mt-9">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="text-[13px] text-foreground-muted">{homePathUi.startersLabel}</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      {/* ── פותחי-שיחה משניים: המצבים המוכרים ── לא כרטיסי-ניווט ולא שאלון: אין
          חיצים, אין צמתים/מסלול, אין באדג'ים. אייקון-שיחה מרוסן, כותרת רגועה,
          ושורת-תחושה אחת. הכרטיסים נשארים `<a>` אמיתיים (SEO/ללא-JS). */}
      <ul
        ref={gridRef}
        className="mx-auto mt-5 grid max-w-2xl grid-cols-1 gap-3 sm:max-w-4xl sm:grid-cols-2 lg:grid-cols-4"
      >
        {homePaths.map((p, index) => (
          <li key={p.id} className="contents">
            <Link
              href={p.stationHref}
              data-index={index}
              onClick={(e) => {
                if (!isPlainClick(e)) return;
                e.preventDefault();
                openFocus(p.id, p.askStation);
              }}
              className="situation-card group flex h-full flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4 text-start shadow-sm transition-[border-color,background-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand/40 hover:bg-surface-muted/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0 sm:p-5"
            >
              <span
                aria-hidden="true"
                className="mb-0.5 text-brand/70 opacity-80 transition-opacity group-hover:opacity-100"
              >
                <MessageCircle className="h-[18px] w-[18px]" />
              </span>
              <span
                className="font-serif text-[17px] font-semibold leading-snug text-foreground sm:text-[19px]"
                style={
                  morphId === p.id
                    ? ({ viewTransitionName: "fm-title" } as React.CSSProperties)
                    : undefined
                }
              >
                {p.buttonTitle}
              </span>
              <span className="text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[14px]">
                {p.buttonSub}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
