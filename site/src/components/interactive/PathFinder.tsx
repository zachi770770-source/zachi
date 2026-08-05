"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { stations, type Station } from "@/content/stations";
import { tools } from "@/content/book";
import { resolveToolId } from "@/lib/pathfinder/toolMapping";
import { saveCompass } from "@/lib/compass/quizStorage";
import { trackEvent } from "@/lib/analytics";

/**
 * „מגלה-המסלול” — מנוע השאלון *היחיד* באתר: שלוש שאלות סגורות → נקודת פתיחה
 * (תחנה) + כלי מעשי מהספר + פעולה אחת ברורה. דטרמיניסטי לחלוטין, בצד-הלקוח:
 * אין טקסט חופשי, אין API חיצוני, אין אבחון או אחוזי-ביטחון — רק ניתוב לתוכן
 * קיים ומאושר (src/content/stations.ts + הכלים ב-book.ts, דרך toolMapping).
 *
 * אותו רכיב מוצג גם בבית (מקטע #where) וגם ב-/compass וב„משגר המצפן” — כך
 * שהשאלון והתוצאה זהים בכל מקום (מנוע אחד, לא שני שאלונים).
 *
 * `onResolveStation` מדווח להורה על התחנה שהותאמה (או null באיפוס) — לצורך
 * הדגשת התחנה במסלול שבבית. בנוסף התחנה נשמרת מקומית (מזהה בלבד) לביקור חוזר
 * וחוצה-דפים. נגישות: כל שאלה radiogroup נטיבי, התקדמות מוכרזת, תוצאה ב-aria-live.
 */

type StationId = Station["id"];

// ——— מיפויים דטרמיניסטיים (תוכן קיים ומאומת בלבד) ———
const Q1: { label: string; station: StationId }[] = [
  { label: "אני מחפש/ת קשר", station: "before-relationship" },
  { label: "אני מתחיל/ה מחדש", station: "starting-again" },
  { label: "אני בתוך קשר ורוצה לבנות אותו טוב יותר", station: "inside-relationship" },
];
const Q2: { label: string }[] = [
  { label: "אני נועל/ת מסקנה מהר על אדם או על מצב" },
  { label: "קשה לי לדעת אם מה שאני מרגיש/ה זה סימן אמיתי" },
  { label: "אני מגיב/ה לרגע, ומתחרט/ת אחר כך" },
];
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

export function PathFinder({
  onResolveStation,
  onActiveChange,
}: {
  onResolveStation?: (stationId: StationId | null) => void;
  /** מדווח כשהמשתמש התחיל לענות (true) ועד איפוס (false) — כדי שההורה יסתיר מיד
      כל „תוצאה קודמת” (למשל באנר „השלמתם את המצפן”) ברגע שנבחרה תשובה לשאלה 1. */
  onActiveChange?: (active: boolean) => void;
} = {}) {
  // answers[0..2] = index הבחירה בכל שאלה; null = טרם נבחר.
  const [answers, setAnswers] = React.useState<(number | null)[]>([null, null, null]);
  const [step, setStep] = React.useState(0); // 0..2 שאלה נוכחית; 3 = תוצאה
  const startedRef = React.useRef(false);
  const resultHeadingRef = React.useRef<HTMLHeadingElement>(null);

  const choose = (qIndex: number, optIndex: number) => {
    if (!startedRef.current) {
      startedRef.current = true;
      onActiveChange?.(true); // מסתיר מיד תוצאה קודמת בהורה
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
  };

  const restart = () => {
    startedRef.current = false;
    onActiveChange?.(false);
    setAnswers([null, null, null]);
    setStep(0);
  };

  const done = step === 3 && answers.every((a) => a !== null);
  const station = done ? stations[Q1[answers[0]!].station] : null;
  // הכלי המעשי נגזר מצירוף התחנה (Q1) והקושי (Q2) דרך המיפוי הדטרמיניסטי — כך
  // כל ששת הכלים נגישים. כל הכלים קיימים ב-book.ts, ולכן ה-find תמיד מוצא.
  const difficulty = done ? Q2[answers[1]!].label : null;
  const tool = done
    ? tools.items.find(
        (t) => t.id === resolveToolId(Q1[answers[0]!].station, answers[1]!),
      ) ?? tools.items[0]
    : null;
  const emphasis: Emphasis | null = done ? Q3[answers[2]!].emphasis : null;

  // דיווח להורה + שמירה מקומית (מזהה תחנה בלבד) עם השלמת השאלון; איפוס → null.
  React.useEffect(() => {
    if (done && station) {
      saveCompass(station.id);
      onResolveStation?.(station.id);
    } else if (!done) {
      onResolveStation?.(null);
    }
  }, [done, station, onResolveStation]);

  // עם השלמת השאלון — הנחתה + מיקוד על כותרת התוצאה (מיד, בלי „שטח ריק”). ה-
  // scroll-mt מרחיק את הכותרת מתחת ל-header הדביק. תנועה מנוטרלת גלובלית תחת
  // reduced-motion, ולכן התוצאה גלויה מיידית.
  React.useEffect(() => {
    if (!done) return;
    const el = resultHeadingRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollIntoView({ block: "start" });
      el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [done]);

  // שלוש פעולות אמיתיות. תשובת שאלה 3 קובעת מי מהן ה-CTA הראשי; האחרות יורדות
  // לפעולות-משנה שקטות. כל יעד הוא עמוד אמיתי עם תוכן מאושר.
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
    <div className="pathfinder mx-auto max-w-2xl">
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
          <div role="radiogroup" aria-label={QUESTIONS[step].title} className="mt-6 grid gap-2.5">
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
          <h3
            ref={resultHeadingRef}
            tabIndex={-1}
            className="mt-3 scroll-mt-24 font-serif text-[1.4rem] font-semibold leading-snug text-foreground focus:outline-none"
          >
            נקודת הפתיחה שלכם: {station!.navLabel}
          </h3>
          <p className="mt-3 text-[1.05rem] leading-[1.75] text-foreground">{station!.lead}</p>

          {/* הקושי המרכזי שנבחר (שאלה 2) — הד קצר, לא אבחוני. */}
          <p className="mt-4 text-[15px] leading-relaxed text-foreground-muted">
            מה שאתם מזהים: <span className="font-semibold text-foreground">„{difficulty}”</span>.
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

          {/* פעולה אחת ברורה — הניסוח נגזר מתשובת שאלה 3 (לא הבטחה, לא תוכן מומצא). */}
          <p className="mt-5 text-[15px] leading-relaxed text-foreground">
            {emphasis === "tool"
              ? "פעולה אחת עכשיו: פתחו את כרטיס הכלי בעמוד הספר וראו איך הוא עובד."
              : emphasis === "station"
                ? "פעולה אחת עכשיו: עברו לעמוד התחנה שלכם והבינו מה הספר מציע בה."
                : "פעולה אחת עכשיו: קראו קטע קצר שמתכתב עם מה שאתם מזהים — בלי הרשמה."}
          </p>

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
    </div>
  );
}
