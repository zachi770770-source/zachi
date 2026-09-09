"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { focusUi, getFocusSituation } from "@/content/focusMode";
import type { HomePathId } from "@/content/homePaths";
import { withViewTransition } from "@/lib/motion/viewTransition";

/**
 * „עובדה מול סיפור” — **הדגמה אחת של רעיון אחד מהספר**, בשני שלבים.
 *
 * מה זה היה, ומה זה עכשיו:
 *
 * קודם זו הייתה במה בת ארבע פעימות עם סרגל-לשוניות של ארבעה מצבים, מחוון-
 * שלבים, וכפתור-סיום שלא ניווט לשום מקום אלא פתח שאלון נוסף — והכול ישב
 * *בתוך הגלילה הראשית של עמוד הבית*, בין פסקה עריכתית לפסקה עריכתית. מבקר
 * שהגיע מגוגל לספר דייטינג נתקל בתרגיל בן ארבעה שלבים, בשפה של גיליון-עבודה
 * טיפולי, לפני שראה מה הספר בכלל מציע.
 *
 * עכשיו:
 *   • **opt-in בלבד** — הוא נכנס רק מתוך /method/fact-story, בלחיצה מפורשת.
 *     הוא אינו קיים בעמוד הבית.
 *   • **שני שלבים** — הפיצול, וההבנה. תחת 30 שניות.
 *   • **בלי chrome של אפליקציה** — אין לשוניות-מצבים ואין מחוון-שלבים.
 *   • **הדוגמה מוצהרת כדוגמה מהספר**, ולא מתחזה לרגע של המבקר.
 *   • **יציאה אחת, אמיתית** — `<Link href="/book">`. לא שאלון, לא החלפת-מקטע.
 *
 * שכבת-בסיס: הרכיב הוא שיפור-הדרגתי. תוכן הכלי עצמו קיים ונקרא בעמוד גם בלי
 * JS; זו הדגמה מעליו, לא תחליף לו.
 */

type Stage = "split" | "aha";

export function FocusMode({
  situationId,
  onClose,
}: {
  situationId: HomePathId;
  /** סגירת ההדגמה וחזרה לעמוד. */
  onClose: () => void;
}) {
  const s = getFocusSituation(situationId);
  const [stage, setStage] = React.useState<Stage>("split");
  const stageRef = React.useRef<HTMLDivElement>(null);

  const go = (next: Stage) => {
    withViewTransition(() => flushSync(() => setStage(next)));
  };

  // פוקוס אל הבמה בכל החלפת-שלב (קורא/ת-מסך). אין כאן עוד רשת-ביטחון לגלילה:
  // הבמה בת שני שלבים בגובה דומה, ואין קפיצת-פריסה שדורשת מסגור מחדש.
  React.useEffect(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, [stage]);

  return (
    <div
      ref={stageRef}
      tabIndex={-1}
      className="home-focus fm-stage fm-stage--compact"
      role="region"
      aria-label={focusUi.regionLabel}
      data-stage={stage}
      data-situation={situationId}
    >
      <span className="fm-bg" aria-hidden="true" />

      <div className="fm-shell">
        <div className="fm-topbar">
          <button type="button" onClick={onClose} className="fm-back">
            {focusUi.backLabel}
          </button>
          {/* מסגור-האמת: זו דוגמה מהספר, לא הרגע שלכם. */}
          <span className="fm-status">{focusUi.exampleNote}</span>
        </div>

        {stage === "split" && (
          <div className="fm-scene fm-scene--split">
            <div className="fm-duo">
              <div className="fm-side fm-side--fact">
                <span className="fm-side__tag">{focusUi.factTag}</span>
                <p className="fm-fact">{s.fact}</p>
              </div>
              <span className="fm-gap" aria-hidden="true" />
              <div className="fm-side fm-side--story">
                <span className="fm-side__tag">{focusUi.storyTag}</span>
                <p className="fm-story-text">{s.story}</p>
              </div>
            </div>
            <p className="fm-prompt">{focusUi.storyPrompt}</p>
            <div className="fm-cta-row">
              <button type="button" onClick={() => go("aha")} className="fm-cta fm-cta--solid">
                {focusUi.separateLabel}
              </button>
            </div>
          </div>
        )}

        {stage === "aha" && (
          <div className="fm-scene fm-scene--aha">
            <p className="fm-fact fm-fact--echo">{s.fact}</p>
            <div className="fm-aha__block">
              <p className="fm-aha__line">{focusUi.ahaHeadline}</p>
              <p className="fm-aha__note">{focusUi.separationLine}</p>
            </div>
            <p className="fm-bridge">{s.bridge}</p>
            {/* היציאה היחידה, וקישור אמיתי. */}
            <div className="fm-cta-row">
              <Link href="/book" className="fm-cta fm-cta--brand">
                {focusUi.continueLabel}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
