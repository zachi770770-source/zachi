"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * חשיפת טקסט מדורגת — „קריאה מבוקרת” מילה-אחר-מילה (PHASE 14).
 *
 * הרעיון: הקורא מקבל את המשפט בהדרגה, מילה אחרי מילה, במקום לראות את כל
 * הקטע בבת אחת. החשיפה היא לפי מילה בלבד (לא אות), פעם אחת בלבד כשהקטע
 * נכנס למסך באופן משמעותי, בלי לולאה ובלי „טייפרייטר”.
 *
 * שלמות ונגישות (דרישות קשיחות):
 * - הטקסט המלא קיים ב-HTML שמרונדר בשרת (SSR) ומוצג כברירת מחדל.
 * - קוראי מסך מקבלים כל משפט שלם פעם אחת (sr-only), לא מילים מבודדות;
 *   ה-spans של המילים דקורטיביים ומוסתרים מטכנולוגיה מסייעת (aria-hidden).
 * - נפילה בטוחה: ללא JS / prefers-reduced-motion / ללא IntersectionObserver /
 *   הידרציה מתעכבת או נכשלת ⇒ הטקסט המלא גלוי מיד. אין מצב ריק ב-first-paint.
 * - אין CLS: המילים תופסות מקום תמיד (opacity + transform בלבד).
 *
 * ביצועים: CSS + IntersectionObserver יחיד. אין ספריות אנימציה, אין
 * requestAnimationFrame, אין טיימרים; ה-stagger מיושם ב-transition-delay.
 * ה-observer מנותק אחרי ההפעלה הראשונה וב-cleanup (אין הפעלה חוזרת).
 */

/** מרווח בין מילים (60–90ms) */
const WORD_STEP_MS = 75;
/** השהיה בין משפטים (180–260ms) */
const SENTENCE_PAUSE_MS = 220;

/** מפצל טקסט קיים למשפטים לפי נקודה — ללא שינוי/הרחבה של התוכן. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type StagedWord = { word: string; delay: number };

/**
 * בונה מודל טהור: לכל קבוצה, רשימת משפטים, ולכל משפט רשימת מילים עם ההשהיה
 * המצטברת (ציר זמן רציף אחד על פני כל הקבוצות). ההשהיה = index-מילה * מרווח
 * + index-משפט * השהיית-משפט. פונקציה טהורה — אין mutation ב-scope הרינדור.
 */
function buildStagedModel(
  groups: StagedGroup[]
): { sentences: StagedWord[][] }[] {
  let wordIndex = 0;
  let sentenceIndex = 0;
  return groups.map((group) => {
    const sentences = splitSentences(group.text).map((sentence) => {
      const words = sentence
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
          const delay =
            wordIndex * WORD_STEP_MS + sentenceIndex * SENTENCE_PAUSE_MS;
          wordIndex += 1;
          return { word, delay };
        });
      sentenceIndex += 1;
      return words;
    });
    return { sentences };
  });
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type StagedGroup = {
  /** הטקסט המקורי המלא (verbatim) — משמש גם ל-SSR וגם לקורא מסך. */
  text: string;
  /** אלמנט העטיפה (ברירת מחדל: p). */
  as?: React.ElementType;
  id?: string;
  className?: string;
};

export function StagedTextReveal({
  groups,
  className,
}: {
  groups: StagedGroup[];
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [armed, setArmed] = React.useState(false);
  const [revealing, setRevealing] = React.useState(false);

  // חימוש לפני paint (רק כשיש תנועה מותרת ו-IO נתמך). ללא כך — נשאר גלוי.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    setArmed(true);

    // אם הקטע כבר בתוך/מעל אזור התצוגה (deep-link, reload בגלילה, מעל-הקיפול,
    // או סצנה נעוצה שבה ה-IO עלול לא לחצות סף) — חושפים מיד, בלי להמתין ל-IO.
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (el.getBoundingClientRect().top < vh * 0.92) {
      setRevealing(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealing(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);

    // גיבוי קשיח: אם ה-IO לא נורה מסיבה כלשהי (סצנה נעוצה, race, מנוע דפדפן) —
    // חושפים בכל מקרה כדי שהמילים לעולם לא יישארו נסתרות. „חי” > „מושלם”.
    const failsafe = window.setTimeout(() => setRevealing(true), 3000);
    return () => {
      observer.disconnect();
      clearTimeout(failsafe);
    };
  }, []);

  const model = buildStagedModel(groups);

  return (
    <div
      ref={ref}
      className={cn(
        "staged-reveal",
        armed && "is-armed",
        revealing && "is-revealing",
        className
      )}
    >
      {groups.map((group, gi) => {
        const Tag = group.as ?? "p";
        const sentences = model[gi].sentences;
        return (
          <Tag key={gi} id={group.id} className={group.className}>
            {/* גרסה חזותית מונפשת — דקורטיבית, מוסתרת מקוראי מסך */}
            <span aria-hidden="true">
              {sentences.map((words, si) => (
                <span key={si} className="staged-sentence">
                  {words.map(({ word, delay }, wi) => (
                    <React.Fragment key={wi}>
                      <span
                        className="staged-word"
                        style={
                          {
                            "--staged-delay": `${delay}ms`,
                          } as React.CSSProperties
                        }
                      >
                        {word}
                      </span>
                      {wi < words.length - 1 ? " " : null}
                    </React.Fragment>
                  ))}
                  {si < sentences.length - 1 ? " " : null}
                </span>
              ))}
            </span>
            {/* גרסה סמנטית מלאה לקורא מסך — משפט שלם, פעם אחת */}
            <span className="sr-only">{group.text}</span>
          </Tag>
        );
      })}
    </div>
  );
}
