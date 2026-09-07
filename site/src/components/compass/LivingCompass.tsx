"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * „המצפן החי” — טבעות ומחט שמחפשת ומתייצבת לכיוון. הכיוון תמיד משמעותי, והוא
 * נגזר ממצב-אמת של החוויה ולא מקישוט:
 *
 *   rest     — מנוחה. המחט בזווית „מפוזרת”, ללא תנועה.
 *   seeking  — המשתמש שאל. המחט נעה בתוך טווח חסום סביב היעד (חיפוש פיזי),
 *              והטבעת מגיבה. זהו *משוב-התקדמות*, לא תיאטרון-חשיבה.
 *   settled  — התקבלה תשובה. המחט מתייצבת אל „הצפון” של הספר, לעבר הפעולה.
 *
 * **אין סיבוב אינסופי.** בגרסה הקודמת היו כאן שתי אנימציות `infinite` (טבעת
 * מקווקוות מסתובבת + מטאטא ראדאר) — כלומר תנועה שרצה תמיד ואינה אומרת דבר,
 * ובמצב טעינה היא הופכת ללוגו מסתובב בלי סוף. הן הוסרו. כל תנועה כאן נובעת
 * ממעבר-מצב, ומצב `seeking` הוא היחיד שמניע את המחט — בתנודה חסומה ודועכת
 * שנעצרת מעצמה גם אם התשובה מתעכבת.
 *
 * דקורטיבי (aria-hidden): הסטטוס הנגיש נמסר בטקסט ליד הרכיב, לא כאן.
 * transform בלבד. תחת prefers-reduced-motion — כיוון סופי מיידי, ללא תנועה.
 */

const REST = 42; // „מחפש” — זווית מפוזרת
const SETTLED = -44; // „הצפון” של הספר, לעבר הפעולה
const HOVER = -60; // תגובה זעירה לריחוף/פוקוס
/** משרעת החיפוש סביב היעד — חסומה בכוונה, כדי שלא ייראה כמחוג מטורף. */
const SEEK_SWING = 26;

export type CompassState = "rest" | "seeking" | "settled";

export function LivingCompass({
  className,
  state = "rest",
}: {
  className?: string;
  state?: CompassState;
}) {
  const ref = React.useRef<SVGSVGElement>(null);
  const reduce =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

  const [hovered, setHovered] = React.useState(false);
  /** סטייה נוכחית מהיעד בזמן „חיפוש”. 0 בכל שאר המצבים. */
  const [seekOffset, setSeekOffset] = React.useState(0);

  // הזווית *נגזרת* מהמצב ולא מוחזקת ב-state נפרד: אין מסלול שבו המחט נשארת
  // בזווית של מצב קודם אחרי מעבר מהיר, ואין setState סינכרוני בתוך effect.
  const angle = reduce
    ? state === "rest"
      ? REST
      : SETTLED
    : state === "seeking"
      ? SETTLED + seekOffset
      : state === "settled"
        ? SETTLED
        : hovered
          ? HOVER
          : REST;

  // ── מצב „חיפוש”: תנודה חסומה ודועכת סביב היעד ─────────────────────────────
  // מונע-טיימר יחיד, ולא אנימציית CSS אינסופית: התנודה דועכת אל היעד ונעצרת
  // מעצמה. גם אם הבקשה נתקעת, המחט לא תמשיך לנוע לנצח.
  //
  // ניקוי/מירוצים: לכל כניסה ל-`seeking` יש טיימר אחד שנשמר ב-ref ומבוטל גם
  // בשינוי-מצב וגם בפירוק, כך שאין שני מחזורי-חיפוש במקביל אחרי שליחה חוזרת,
  // ואין callback שיורה אחרי unmount ומחזיר זווית ישנה.
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    const clear = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    clear();
    if (reduce || state !== "seeking") return clear;

    // seeking — תנודה דועכת סביב היעד, ואז התייצבות. הצעד הראשון מתוזמן
    // (ולא מופעל סינכרונית), ולכן אין setState בתוך גוף ה-effect.
    let step = 0;
    const tick = () => {
      step += 1;
      const decay = Math.max(0, 1 - step / 6); // דועך תוך ~6 צעדים
      if (decay === 0) {
        setSeekOffset(0);
        timer.current = null;
        return;
      }
      const dir = step % 2 === 0 ? 1 : -1;
      setSeekOffset(dir * SEEK_SWING * decay);
      timer.current = setTimeout(tick, 420);
    };
    timer.current = setTimeout(tick, 0);
    return () => {
      clear();
      // יציאה ממצב-חיפוש מאפסת את הסטייה, כדי שכניסה חוזרת לא תתחיל
      // מהזווית שנשארה מהחיפוש הקודם.
      setSeekOffset(0);
    };
  }, [state, reduce]);

  const interactive = !reduce && state !== "seeking";

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      data-compass-state={state}
      className={cn("living-compass", className)}
      onPointerEnter={() => interactive && setHovered(true)}
      onPointerLeave={() => interactive && setHovered(false)}
    >
      {/* טבעות — סטטיות. הטבעת האמצעית מתרחבת מעט במצב „חיפוש”, כתגובה חסומה. */}
      <circle cx="50" cy="50" r="46" className="living-compass__ring-outer" />
      <circle cx="50" cy="50" r="40" className="living-compass__ring-sweep" />
      <circle cx="50" cy="50" r="34" className="living-compass__ring-inner" />
      {/* שנתות ראשיות (N/E/S/W) */}
      {[0, 90, 180, 270].map((d) => (
        <line
          key={d}
          x1="50"
          y1="6"
          x2="50"
          y2="13"
          className="living-compass__tick"
          transform={`rotate(${d} 50 50)`}
        />
      ))}
      {/* המחט */}
      <g
        className="living-compass__needle"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <path d="M50 12 L55 50 L50 56 L45 50 Z" className="living-compass__north" />
        <path d="M50 88 L45 50 L50 44 L55 50 Z" className="living-compass__south" />
      </g>
      <circle cx="50" cy="50" r="3.4" className="living-compass__hub" />
    </svg>
  );
}
