"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { sampleReader } from "@/content/sample";
import { BookLink } from "@/components/shared/BookLink";

/**
 * „הצצה פנימה” — כניסה מוחשית וקומפקטית אל הטעימה. שלושה עלים קצרים שאפשר
 * להפוך במגע, בגרירה או במקלדת, ובסופם מעבר אל הקורא המלא.
 *
 * **הקורא נשאר הראשי.** זה אינו קורא שני: אין כאן העתק של הטעימה המלאה, אין
 * מפת-פרקים, ואין העדפות-קריאה. הווידג'ט יושב ב-/book — עמוד שאינו מרנדר את
 * `sampleReader` — ולכן אין בשום מסך *שני עותקים נגישים* של אותו טקסט.
 *
 * זהירות מכוונת: מנגנון „דפדוף העלים” בקורא עצמו הוסר בעבר מפני שהסתיר תוכן
 * אחרי הידרציה (opacity/transform שנשארו כשאירוע-החשיפה לא ירה). לכן כאן
 * *מצב-הבסיס הוא תוכן גלוי*: העלה הפעיל קריא במלואו ללא JS, וההיפוך הוא
 * שיפור-הדרגתי בלבד. אף טקסט אינו תלוי באנימציה שתסתיים.
 *
 * נגישות: רק העלה הפעיל נמצא בעץ-הנגישות; האחרים `aria-hidden` + `inert`,
 * ולכן קורא-מסך שומע עמוד אחד בכל רגע. הכפתורים הם פקדים אמיתיים, והמקלדת
 * עובדת גם בלי גרירה. תחת prefers-reduced-motion ההחלפה מיידית, ללא סיבוב.
 */

/** שלושת העלים — טקסט מאושר קיים בלבד, מקוצר לכדי „הצצה”. */
const LEAVES = [
  { kind: "opening" as const, text: sampleReader.opening },
  { kind: "principle" as const, text: sampleReader.principle.emphasis },
  { kind: "question" as const, text: sampleReader.readerQuestion },
];

/** מעל זה — הגרירה נחשבת „הפיכה”. מתחת — חוזרת למקומה. */
const TURN_RATIO = 0.28;

export function PeekInside() {
  const [index, setIndex] = React.useState(0);
  const [drag, setDrag] = React.useState(0); // -1..1, יחסי לרוחב
  const [dragging, setDragging] = React.useState(false);
  const stackRef = React.useRef<HTMLDivElement>(null);
  const pointer = React.useRef<{ id: number; x: number; w: number } | null>(null);
  const reduce =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

  const last = LEAVES.length - 1;
  const go = React.useCallback(
    (next: number) => setIndex((i) => Math.min(last, Math.max(0, next ?? i))),
    [last],
  );

  // ── גרירה ─────────────────────────────────────────────────────────────────
  // pointer capture מוחזק ב-ref ומשוחרר בכל מסלול-יציאה (up / cancel / פירוק),
  // כדי שלא יישאר לכידה תלויה שחוסמת אירועים אחרי שהאצבע עזבה.
  const endDrag = React.useCallback(
    (commit: boolean) => {
      const p = pointer.current;
      pointer.current = null;
      setDragging(false);
      setDrag((d) => {
        if (commit && Math.abs(d) > TURN_RATIO) {
          // ב-RTL גרירה *שמאלה* (d שלילי) מתקדמת קדימה בקריאה.
          setIndex((i) => Math.min(last, Math.max(0, i + (d < 0 ? 1 : -1))));
        }
        return 0; // תמיד חוזר ל-0 — גם ההפיכה וגם הביטול מסתיימים במנוחה
      });
      const el = stackRef.current;
      if (el && p && el.hasPointerCapture?.(p.id)) {
        try {
          el.releasePointerCapture(p.id);
        } catch {
          /* הלכידה כבר שוחררה */
        }
      }
    },
    [last],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // תחת תנועה-מופחתת אין גרירה כלל: ההחלפה מיידית דרך הכפתורים/המקלדת,
    // בלי סיבוב ובלי מעקב-אצבע.
    if (reduce) return;
    const el = stackRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width || 1;
    pointer.current = { id: e.pointerId, x: e.clientX, w };
    setDragging(true);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* דפדפן ללא lock — הגרירה עדיין עובדת */
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    if (!p || p.id !== e.pointerId) return;
    const d = (e.clientX - p.x) / p.w;
    // חוסמים גרירה מעבר לקצוות — אין „מתיחה” אל מעבר לעלה הראשון/אחרון.
    const bounded =
      (index === 0 && d > 0) || (index === last && d < 0) ? d * 0.25 : d;
    setDrag(Math.max(-1, Math.min(1, bounded)));
  };

  // ניקוי-בטיחות: אם הרכיב מתפרק באמצע גרירה, משחררים לכידה ומאפסים מצב.
  React.useEffect(() => {
    const el = stackRef.current;
    return () => {
      const p = pointer.current;
      if (el && p && el.hasPointerCapture?.(p.id)) {
        try {
          el.releasePointerCapture(p.id);
        } catch {
          /* אין מה לשחרר */
        }
      }
      pointer.current = null;
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // RTL: „קדימה” בקריאה הוא החץ השמאלי.
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index - 1);
    }
  };

  return (
    <section className="peek" aria-labelledby="peek-heading">
      <h2 id="peek-heading" className="kicker">
        הצצה פנימה
      </h2>

      <div
        ref={stackRef}
        className="peek__stack"
        data-dragging={dragging ? "" : undefined}
        style={{ ["--peek-drag" as string]: String(drag) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => endDrag(true)}
        onPointerCancel={() => endDrag(false)}
        onKeyDown={onKeyDown}
        role="group"
        aria-roledescription="עלי הצצה"
        aria-label={`עלה ${index + 1} מתוך ${LEAVES.length}`}
        tabIndex={0}
      >
        {LEAVES.map((leaf, i) => {
          const state = i < index ? "turned" : i === index ? "current" : "ahead";
          return (
            <article
              key={leaf.kind}
              className="peek__leaf"
              data-state={state}
              style={{ ["--depth" as string]: String(i - index) }}
              aria-hidden={state === "current" ? undefined : true}
              inert={state !== "current"}
            >
              <p className="peek__text">{leaf.text}</p>
            </article>
          );
        })}
      </div>

      <div className="peek__controls">
        <button
          type="button"
          className="peek__btn"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="העלה הקודם"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="peek__count" aria-hidden="true">
          {index + 1} / {LEAVES.length}
        </span>
        <button
          type="button"
          className="peek__btn"
          onClick={() => go(index + 1)}
          disabled={index === last}
          aria-label="העלה הבא"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p className="peek__more">
        <BookLink href="/preview" className="peek__link">
          {sampleReader.title}
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </BookLink>
      </p>
    </section>
  );
}
