"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { focusUi, getFocusSituation } from "@/content/focusMode";
import type { HomePathId } from "@/content/homePaths";
import { withViewTransition } from "@/lib/motion/viewTransition";

/**
 * Focus Mode — חוויית „איפה זה פוגש אותך עכשיו?”.
 *
 * לא שאלון עם כרטיסים שמתחלפים: כניסה למצב היא *השתלטות* אימרסיבית — משטח כהה
 * ועמוק שבו הסביבה נסוגה — והחוויה מתקדמת כרצף של ארבע פעימות, שלכל אחת
 * composition שונה בהתאם למשמעותה, ובשלוש שכבות-תנועה שנועדו להיות הבסיס לשפת-
 * התנועה של האתר (ראו `.fm-*` ב-globals.css):
 *
 *   1. Enter   — המצב שנבחר עולה גדול ודומיננטי (ממשיך/morph מהכרטיס).
 *   2. Split   — הרגע נפרד לשני צדדים שמתחילים קרובים ואז *נפתחים* זה מזה;
 *                הפער מורגש גם בלי לקרוא (עובדה = Sage, סיפור = Terracotta).
 *   3. Aha     — הרגע המרכזי: משפט-ההפרדה בטיפוגרפיה גדולה, ניגודיות-רקע
 *                משתנה ו-whitespace. הסיפור נסוג לגמרי; העובדה מאושרת.
 *   4. Action  — שלב חדש ונקי (משטח בהיר), מסגור-הפעולה מהספר וה-CTA.
 *
 * המשכיות-אלמנט (shared-element) דרך View Transitions API (feature-detected,
 * מגודר ב-`.motion-js`): כותרת-המצב נושאת `view-transition-name: fm-title`
 * ומתמזגת מהכרטיס דרך כל הפעימות; פסקת-העובדה נושאת `fm-fact` ומתמזגת מהנתיב
 * אל אישור ה-Aha. ללא תמיכה / reduced-motion / ללא-JS — אותה זרימה בדיוק,
 * במעברי-מצב מיידיים (המצב הסופי תמיד קריא ונגיש).
 *
 * שכבת-בסיס: הרכיב עולה רק כשיפור-הדרגתי (JS). כרטיסי-המצב נשארים `<a>` אמיתיים
 * ב-`HomePathEntry`. ה-CTA „המשיכו עם הספר” ממשיך אל השיחה (`HomeConversation`).
 */

const STAGE_ORDER = ["enter", "split", "aha", "action"] as const;
type Stage = (typeof STAGE_ORDER)[number];

export function FocusMode({
  situationId,
  onContinue,
  onBack,
}: {
  situationId: HomePathId;
  /** ממשיך אל השיחה הדטרמיניסטית של המצב (נחשף בשלב הפעולה). */
  onContinue: () => void;
  /** חזרה לבחירת-המצב. */
  onBack: () => void;
}) {
  const s = getFocusSituation(situationId);
  const [stage, setStage] = React.useState<Stage>("enter");
  const stageRef = React.useRef<HTMLDivElement>(null);
  const stepIndex = STAGE_ORDER.indexOf(stage);

  // מעבר-פעימה בתוך View Transition; flushSync כדי שה-DOM החדש ייצולם למיזוג.
  const go = (next: Stage) => {
    withViewTransition(() => flushSync(() => setStage(next)));
  };

  // בטעינה ובכל החלפת-פעימה: פוקוס אל הבמה, כדי שקורא/ת-מסך תגיע לתוכן החדש.
  React.useEffect(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, [stage]);

  return (
    <div
      ref={stageRef}
      tabIndex={-1}
      className="home-focus fm-stage"
      role="region"
      aria-label={focusUi.regionLabel}
      data-stage={stage}
    >
      {/* עומק-רקע (controlled gradients) + נשימת-Ambient — דקורטיביים בלבד. */}
      <span className="fm-bg" aria-hidden="true" />
      <span className="fm-ambient" aria-hidden="true" />

      <div className="fm-shell">
        <div className="fm-topbar">
          <button type="button" onClick={onBack} className="fm-back">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            {focusUi.backLabel}
          </button>
          {/* מחוון-פעימות (רצף של ארבעה מסכים) — דקורטיבי. */}
          <span className="fm-steps" aria-hidden="true">
            {STAGE_ORDER.map((st, i) => (
              <span
                key={st}
                className="fm-steps__dot"
                data-on={i <= stepIndex ? "true" : undefined}
              />
            ))}
          </span>
        </div>

        {stage === "enter" && (
          <div className="fm-scene fm-scene--enter">
            <p className="fm-eyebrow">{focusUi.eyebrow}</p>
            <h3 className="fm-title fm-title--hero">{s.title}</h3>
            <p className="fm-lede">{focusUi.intro}</p>
            <div className="fm-cta-row">
              <button type="button" onClick={() => go("split")} className="fm-cta fm-cta--ghost">
                {focusUi.enterCta}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {stage === "split" && (
          <div className="fm-scene fm-scene--split">
            <h3 className="fm-title fm-title--mini">{s.title}</h3>
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
            <p className="fm-aha__line">{focusUi.separationLine}</p>
            <div className="fm-cta-row">
              <button type="button" onClick={() => go("action")} className="fm-cta fm-cta--quiet">
                {focusUi.ahaCta}
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {stage === "action" && (
          <div className="fm-scene fm-scene--action">
            <div className="fm-panel">
              <p className="fm-eyebrow fm-eyebrow--brand">{focusUi.actionEyebrow}</p>
              <p className="fm-lede fm-lede--ink">{focusUi.actionIntro}</p>
              <p className="fm-bridge">{s.bridge}</p>
              <div className="fm-actions">
                <button type="button" onClick={onContinue} className="fm-cta fm-cta--brand">
                  {focusUi.continueLabel}
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link href={s.stationHref} className="fm-cta fm-cta--link">
                  {s.stationLabel}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
