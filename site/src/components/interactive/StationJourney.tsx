"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, RotateCcw } from "lucide-react";

import { stations, stationOrder, type Station } from "@/content/stations";
import { tools } from "@/content/book";
import { resolveToolId } from "@/lib/pathfinder/toolMapping";
import { loadCompass } from "@/lib/compass/quizStorage";
import { Container } from "@/components/shared/Container";
import { trackEvent } from "@/lib/analytics";

/**
 * „איפה אתם נתקעים בדרך לקשר?” — מגלה-מסלול אישי בן שלוש שאלות קצרות. אינו
 * אבחון, מבחן או ייעוץ: מיפוי דטרמיניסטי בצד-הלקוח בלבד, על בסיס התוכן הקיים
 * (src/content/stations.ts + הכלים ב-content/book.ts). אין איסוף טקסט חופשי,
 * אין פרופיילינג, אין שליחת התשובות לאנליטיקה (רק אירועי start/complete ללא תוכן).
 *
 * נגישות: כל שאלה היא radiogroup נטיבי (חיצי מקלדת), התקדמות 1/3–3/3 מוכרזת,
 * מצב-הבחירה ב-Sage (לא רק צבע — גם טבעת/סימן). עובד ללא JS: התחנות מוצגות
 * כקישורים ישירים (fallback), וניתן לדלג ישר לכל תחנה בכל שלב. reduced-motion:
 * המעברים הם opacity בלבד (מנוטרלים גלובלית).
 */

type StationId = Station["id"];

// ——— מיפויים דטרמיניסטיים (תוכן קיים ומאומת בלבד) ———
// שלושת קהלי היעד של הספר — ניסוח שמתאים לכל אחד (חיפוש קשר / התחלה מחדש /
// זוגיות קיימת). המיפוי לתחנות לא משתנה.
const Q1: { label: string; station: StationId }[] = [
  { label: "אני מחפש/ת קשר", station: "before-relationship" },
  { label: "אני מתחיל/ה מחדש", station: "starting-again" },
  { label: "אני בתוך קשר ורוצה לבנות אותו טוב יותר", station: "inside-relationship" },
];
// מה חוזר שוב ושוב → אינדקס-קושי (0/1/2). הכלי המעשי נגזר מצירוף התחנה (Q1)
// והקושי (Q2) דרך המיפוי הדטרמיניסטי ב-lib/pathfinder/toolMapping — כך כל
// ששת הכלים מהספר נגישים (ולא רק שלושה). ניסוח ניטרלי שמתאים לכל שלושת קהלי
// היעד (חיפוש קשר / התחלה מחדש / זוגיות קיימת; לא מניח דייטינג).
const Q2: { label: string }[] = [
  { label: "אני נועל/ת מסקנה מהר על אדם או על מצב" },
  { label: "קשה לי לדעת אם מה שאני מרגיש/ה זה סימן אמיתי" },
  { label: "אני מגיב/ה לרגע, ומתחרט/ת אחר כך" },
];
// מה הכי יעזור עכשיו → קובע את הפעולה הראשית *ואת יעדה האמיתי*. שלוש הפעולות
// אמיתיות: קריאת קטע מותאם (‏/preview עם הקשר), הכלי המעשי (‏/book#tool-…), או
// הבנת התחנה (עמוד התחנה). הבחירה כאן היא שקובעת מי ה-CTA הראשי — אין שאלון נוסף.
type Emphasis = "sample" | "tool" | "station";
const Q3: { label: string; emphasis: Emphasis }[] = [
  { label: "לקרוא קטע שמתאים לי", emphasis: "sample" },
  { label: "לראות כלי מעשי שמתאים לי", emphasis: "tool" },
  { label: "להבין את התחנה שלי", emphasis: "station" },
];

const QUESTIONS = [
  { key: "q1", title: "מה מתאר הכי טוב את המקום שלכם עכשיו?", options: Q1.map((o) => o.label) },
  { key: "q2", title: "מה חוזר אצלכם שוב ושוב?", options: Q2.map((o) => o.label) },
  { key: "q3", title: "מה הכי יעזור לכם עכשיו?", options: Q3.map((o) => o.label) },
] as const;

// תוויות דילוג קצרות לשלוש התחנות — מתאימות לשלושת קהלי היעד. מקומיות לשאלון
// (לא משנות את navLabel הגלובלי שמשמש בניווט/בתוצאה/ב-CTA).
const SKIP_LABELS: Record<StationId, string> = {
  "before-relationship": "מחפשים קשר",
  "starting-again": "מתחילים מחדש",
  "inside-relationship": "בתוך קשר",
};

export function StationJourney() {
  // answers[0..2] = index הבחירה בכל שאלה; null = טרם נבחר.
  const [answers, setAnswers] = React.useState<(number | null)[]>([null, null, null]);
  const [step, setStep] = React.useState(0); // 0..2 שאלה נוכחית; 3 = תוצאה
  const startedRef = React.useRef(false);

  // כניסה דרך hash אל השאלון (#where) — deep-link ל-/#where או לחיצה על „למצוא
  // את המסלול שלי”. נוחתים *מיד* על השאלון (scroll-behavior:auto נקודתי) במקום
  // גלילה חלקה ארוכה: לגלילה החלקה הנטיבית למרחק הזה לוקח ~850ms, מעל יעד
  // ה-≤800ms (בעיקר במובייל). ההחלפה נקודתית בלבד — התנהגות-הגלילה החלקה של
  // שאר עוגני-הדף נשמרת (משוחזרת מיד אחרי הנחיתה).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const landOnWhere = () => {
      if (window.location.hash !== "#where") return;
      const el = document.getElementById("where");
      if (!el) return;
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      el.scrollIntoView({ block: "start" });
      requestAnimationFrame(() => {
        html.style.scrollBehavior = prev;
      });
    };
    landOnWhere();
    window.addEventListener("hashchange", landOnWhere);

    // לחיצה על קישור ל-/#where דרך <Link> של Next: הראוטר מעדכן היסטוריה בלי
    // לירות „hashchange”, וגולל בעצמו *חלק* (~800ms+). כדי לנחות ≤800ms מכבים
    // נקודתית את הגלילה החלקה (scroll-behavior:auto) בשלב ה-capture — כך שגלילת
    // ה-Next שמיד אחריה מיידית — בלי preventDefault ובלי להילחם בניווט. משוחזר
    // מיד אחרי, כדי לא לפגוע בגלילה החלקה של שאר עוגני-הדף.
    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.(
        'a[href="/#where"], a[href="#where"]'
      );
      if (!a) return;
      const html = document.documentElement;
      html.style.scrollBehavior = "auto";
      window.setTimeout(() => {
        html.style.scrollBehavior = "";
      }, 150);
    };
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("hashchange", landOnWhere);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  const choose = React.useCallback(
    (qIndex: number, optIndex: number) => {
      if (!startedRef.current) {
        startedRef.current = true;
        trackEvent("path_finder_start"); // ללא תוכן התשובה
      }
      setAnswers((prev) => {
        const next = [...prev];
        next[qIndex] = optIndex;
        return next;
      });
      if (qIndex < 2) {
        setStep(qIndex + 1);
      } else {
        setStep(3);
        trackEvent("path_finder_complete"); // ללא תוכן התשובה
      }
    },
    []
  );

  const restart = React.useCallback(() => {
    setAnswers([null, null, null]);
    setStep(0);
  }, []);

  // מסלול התחנות — כניסה מונפשת מקומית (IntersectionObserver ייעודי), בלתי-תלויה
  // בבקר החשיפה הגלובלי. מצב הבסיס גלוי במלואו (ללא JS / reduced-motion); רק
  // תחת no-preference ה-JS „חומש” את הכניסה (journey-armed → מוסתר) ואז „מעיר”
  // אותה (is-awake → הקו נמשך והצמתים קופצים) כשהמסלול נכנס לתצוגה.
  const journeyRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const el = journeyRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("journey-armed");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-awake");
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const done = step === 3 && answers.every((a) => a !== null);
  const station = done ? stations[Q1[answers[0]!].station] : null;
  // הקושי שנבחר (שאלה 2) והכלי המתאים — נגזר מצירוף התחנה (Q1) והקושי (Q2) דרך
  // המיפוי הדטרמיניסטי. כל הכלים קיימים ב-book.ts, ולכן ה-find תמיד מוצא.
  const difficulty = done ? Q2[answers[1]!].label : null;
  const tool = done
    ? tools.items.find(
        (t) => t.id === resolveToolId(Q1[answers[0]!].station, answers[1]!),
      ) ?? tools.items[0]
    : null;
  const emphasis: Emphasis | null = done ? Q3[answers[2]!].emphasis : null;

  // התחנה ששמורה מ„המצפן” (/compass) — נקראת בבטחה מ-localStorage (null אם
  // ריק/חסום/פגום). מדגישה את התחנה המתאימה בבית ומאפשרת CTA „המשך”.
  const [savedStationId, setSavedStationId] = React.useState<StationId | null>(null);
  React.useEffect(() => {
    // ה-setState נדחה ל-rAF (מחוץ לגוף האפקט) — צד-לקוח בלבד, בלי אי-התאמת
    // הידרציה ובלי „cascading renders”.
    const raf = requestAnimationFrame(() => {
      const saved = loadCompass();
      if (saved) setSavedStationId(saved.stationId);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // התחנה הפעילה במסלול: קודם מה שהותאם בשאלון בבית (אם הושלם), אחרת מה
  // שהמצפן שמר. מקבלת נוכחות ברורה במסלול התחנות.
  const activeStationId: StationId | null = done
    ? Q1[answers[0]!].station
    : savedStationId;

  // שלוש פעולות אמיתיות שנגזרות מהתוצאה. תשובת שאלה 3 קובעת מי מהן היא ה-CTA
  // הראשי (הבולט), ושתי האחרות יורדות לפעולות-משנה שקטות. אין „לשאול את הספר”:
  // כל יעד הוא עמוד אמיתי עם תוכן מאושר.
  //  • sample  → קטע מותאם ב-/preview (הקשר לפי כלי+תחנה, בלי אבחון).
  //  • tool    → כרטיס הכלי ב-/book (העוגן פותח אותו ומעביר focus).
  //  • station → עמוד התחנה המלא.
  const sampleCta =
    tool && station
      ? {
          key: "sample" as const,
          href: `/preview?tool=${tool.id}&station=${station.id}`,
          label: "לקרוא את הקטע שמתאים לי",
        }
      : null;
  const toolCta = tool
    ? { key: "tool" as const, href: `/book#tool-${tool.id}`, label: "לכלי המעשי בעמוד הספר" }
    : null;
  const stationCta = station
    ? { key: "station" as const, href: `/${station.id}`, label: `לתחנה המלאה: ${station.navLabel}` }
    : null;

  // סדר לפי תשובת שאלה 3: הפעולה שנבחרה ראשונה (ראשית/בולטת), אחריה השתיים
  // האחרות (משניות שקטות). לכל היותר שלוש — פעולה ראשית + עד שתי משניות.
  const byKey: Record<Emphasis, { key: Emphasis; href: string; label: string } | null> = {
    sample: sampleCta,
    tool: toolCta,
    station: stationCta,
  };
  const emphasisOrder: Emphasis[] =
    emphasis === "tool"
      ? ["tool", "sample", "station"]
      : emphasis === "station"
        ? ["station", "sample", "tool"]
        : ["sample", "tool", "station"];
  const resultActions = emphasisOrder
    .map((k) => byKey[k])
    .filter((c): c is { key: Emphasis; href: string; label: string } => Boolean(c));

  return (
    <section
      id="where"
      className="scroll-mt-20 pb-14 pt-6 sm:pb-16 sm:pt-8"
      aria-labelledby="where-heading"
    >
      <Container>
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            שלוש שאלות קצרות
          </span>
          <h2 id="where-heading" className="type-h2 mt-4">
            איפה אתם נמצאים במסע הזוגי שלכם?
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">
            בין אם אתם מחפשים קשר, מתחילים מחדש או כבר נמצאים בזוגיות — שלוש שאלות
            קצרות יעזרו לכם למצוא את נקודת הפתיחה שמתאימה לחיים שלכם עכשיו.
          </p>
        </div>

        <div className="pathfinder mx-auto mt-9 max-w-2xl">
          {/* התקדמות 1/3–3/3 */}
          <div className="mb-6 flex items-center justify-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`pathfinder__dot h-1.5 rounded-full transition-all duration-300 ${
                  (done ? 3 : step) > i
                    ? "w-8 bg-brand"
                    : (done ? 3 : step) === i
                      ? "w-8 bg-secondary"
                      : "w-4 bg-border-strong"
                }`}
              />
            ))}
          </div>

          {!done ? (
            <div
              key={step}
              className="pathfinder__q rounded-2xl border border-border bg-surface p-6 text-center shadow-sm sm:p-8"
            >
              <p
                className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover"
                aria-live="polite"
              >
                שאלה {step + 1}/3
              </p>
              <h3 className="mt-3 font-serif text-[1.5rem] font-semibold leading-snug text-foreground">
                {QUESTIONS[step].title}
              </h3>
              <div
                role="radiogroup"
                aria-label={QUESTIONS[step].title}
                className="mt-6 grid gap-2.5"
              >
                {QUESTIONS[step].options.map((label, i) => {
                  const selected = answers[step] === i;
                  return (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => choose(step, i)}
                      className={`lift-hover group flex items-center justify-between gap-3 rounded-xl border px-5 py-4 text-start text-[1.02rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                        selected
                          ? "border-brand bg-brand-muted/50 text-foreground"
                          : "border-border-strong bg-surface text-foreground hover:border-brand/40 hover:bg-surface-muted"
                      }`}
                    >
                      <span>{label}</span>
                      <span
                        aria-hidden="true"
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-brand bg-brand text-brand-foreground"
                            : "border-border-strong text-transparent"
                        }`}
                      >
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="mt-5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  לשאלה הקודמת
                </button>
              ) : null}
            </div>
          ) : (
            <article
              key="result"
              className="stuck-answer rounded-2xl border border-border bg-surface p-6 text-start sm:p-8"
              aria-live="polite"
            >
              <p className="kicker">התאמה אישית</p>
              <h3 className="mt-3 font-serif text-[1.4rem] font-semibold leading-snug text-foreground">
                נקודת הפתיחה שלכם: {station!.navLabel}
              </h3>
              <p className="mt-3 text-[1.05rem] leading-[1.75] text-foreground">
                {station!.lead}
              </p>

              {/* הקושי המרכזי שנבחר (שאלה 2) — הד קצר, לא אבחוני. */}
              <p className="mt-4 text-[15px] leading-relaxed text-foreground-muted">
                מה שאתם מזהים:{" "}
                <span className="font-semibold text-foreground">„{difficulty}”</span>.
              </p>

              <div className="mt-5 rounded-xl border-s-2 border-brand bg-surface-muted/60 p-4">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                  כלי מהספר שיכול לעזור כאן
                </p>
                <p className="mt-2 font-serif text-[1.1rem] font-semibold text-foreground">
                  {tool!.name}
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-foreground-muted">
                  {tool!.description}
                </p>
              </div>

              {/* פעולה אחת ברורה — הניסוח נגזר מתשובת שאלה 3 (לא הבטחה, לא תוכן
                  מומצא). ה-CTA הראשי מתחתיה מוביל בדיוק לאותו יעד. */}
              <p className="mt-5 text-[15px] leading-relaxed text-foreground">
                {emphasis === "tool"
                  ? "פעולה אחת עכשיו: פתחו את כרטיס הכלי בעמוד הספר וראו איך הוא עובד."
                  : emphasis === "station"
                    ? "פעולה אחת עכשיו: עברו לעמוד התחנה שלכם והבינו מה הספר מציע בה."
                    : "פעולה אחת עכשיו: קראו קטע קצר שמתכתב עם מה שאתם מזהים — בלי הרשמה."}
              </p>

              {/* פעולות — הראשית (בולטת) נקבעת בתשובת שאלה 3; אחריה עד שתי פעולות
                  משנה שקטות. כל יעד הוא עמוד אמיתי עם תוכן מאושר. */}
              <div className="mt-4 flex flex-col gap-3">
                {resultActions.map((c, i) => (
                  <Link
                    key={c.key}
                    href={c.href}
                    className={
                      i === 0
                        ? "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-[16px] font-semibold text-surface transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        : "group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                    }
                  >
                    {c.label}
                    <ArrowLeft
                      className={
                        i === 0
                          ? "h-4 w-4"
                          : "h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                      }
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>

              <p className="mt-6 border-t border-border pt-4 text-[13px] leading-relaxed text-foreground-muted">
                זו נקודת פתיחה לקריאה, לא אבחון או ייעוץ.
              </p>

              <button
                type="button"
                onClick={restart}
                className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                להתחיל מחדש
              </button>
            </article>
          )}

          {/* מסלול התחנות — שלוש התחנות כקו-מסע מחובר. הקו והצמתים „מתעוררים”
              בגלילה (‎.reveal → .is-visible), כל צומת מוביל לעמוד הייעודי שלו,
              והתחנה שהותאמה בשאלון (אם הושלם) מקבלת נוכחות ברורה. עובד תמיד —
              גם ללא JS ובלי להשלים שאלות — וכל התוכן במצבו הסופי תחת
              reduced-motion. */}
          {/* המשך מהמצפן: אם הושלם „המצפן” (/compass) ועדיין לא ענו על השאלון
              כאן — מציגים באנר „המשך” עם קישור ישיר לתחנה המתאימה. */}
          {savedStationId && !done ? (
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border-s-2 border-brand bg-surface-muted/60 p-4 text-start">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                השלמתם את המצפן
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-foreground">
                התחנה שמתאימה לכם:{" "}
                <span className="font-semibold">{stations[savedStationId].navLabel}</span>.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link
                  href={`/${savedStationId}`}
                  className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  להמשיך לתחנה שלי
                  <ArrowLeft
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/compass"
                  className="text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  למצפן
                </Link>
              </div>
            </div>
          ) : null}

          <nav
            ref={journeyRef}
            aria-label="דילוג לתחנות המסע"
            className="station-journey mt-8"
          >
            <p className="mb-5 text-center text-[13px] text-foreground-muted">
              או דלגו ישר לתחנה שמתאימה לכם:
            </p>
            <ol className="station-journey__track grid grid-cols-3 gap-1.5 sm:gap-3">
              {stationOrder.map((id, i) => (
                <li
                  key={id}
                  className="station-journey__item"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Link
                    href={`/${id}`}
                    aria-current={activeStationId === id ? "true" : undefined}
                    data-active={activeStationId === id ? "" : undefined}
                    className="station-node group focus-visible:outline-none"
                  >
                    <span className="station-node__dot" aria-hidden="true">
                      <span className="station-node__pulse" aria-hidden="true" />
                    </span>
                    <span className="station-node__label">{SKIP_LABELS[id]}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </Container>
    </section>
  );
}
