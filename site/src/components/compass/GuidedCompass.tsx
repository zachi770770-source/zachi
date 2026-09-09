"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { compassQuiz } from "@/content/compass";
import { BookCover } from "@/components/shared/BookCover";
import { askUi, type AskStationId } from "@/content/askRoute";
import { AskRoute } from "@/components/interactive/AskRoute";
import { GuidanceFocusProvider, GuidanceIntro } from "@/components/guidance/GuidanceFocus";

const POINTS = compassQuiz.points;

/**
 * המצפן המודרך — **כלי ניווט בספר**, לא הערכה של הקשר.
 *
 * מסך-הפתיחה מוסגר מחדש בשלוש נקודות שנמדדו כבעיה:
 *
 *   1. **הכריכה נמצאת כאן.** קודם המסך הזה הראה אייקון-מצפן, כותרת „מה הספר
 *      אומר על המצב שלי?”, ארבעה רדיו — ואז את הפוטר. אפס נוכחות של הספר.
 *      מבקר שהגיע מהתפריט הראשי ראה שאלון ולא הבין מה הקשר לספר.
 *   2. **יש יציאה.** מי שאינו רוצה לענות היה מגיע לפוטר בלי שום המשך. עכשיו
 *      יש שתי דרכים החוצה אל הספר עצמו, בלי לענות על כלום.
 *   3. **השם.** „איפה להתחיל בספר?” מתאר את מה שהכלי עושה. הצ'יפ „נקודת
 *      פתיחה, לא אבחון” כבר אינו נדרש כהתנצלות והפך ל„נקודת התחלה לקריאה”.
 *
 * הפתיח מתקפל ברגע שיש תוצאה (GuidanceIntro), כדי שהתשובה תהיה מוקד המסך.
 * הוא נושא את ה-h1; במצב-תשובה ה-h1 עובר ל-AnswerView (h1 אחד תמיד).
 */
export function GuidedCompass({ initialStation }: { initialStation?: AskStationId }) {
  return (
    <GuidanceFocusProvider>
      <GuidanceIntro className="mb-10 sm:mb-12">
        <header className="enter-stagger mx-auto max-w-2xl text-center">
          {/* הספר עצמו, ולא אייקון של כלי: זה מה שהמבקר בא בשבילו. */}
          <div className="mx-auto w-[104px] sm:w-[120px]" aria-hidden="true">
            <BookCover />
          </div>
          <span className="kicker mt-6 justify-center">{askUi.eyebrow}</span>
          <h1 className="mt-4 font-serif type-hero text-foreground">
            {compassQuiz.ask.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-balance text-foreground-muted">
            {compassQuiz.ask.subtitle}
          </p>

          <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {POINTS.map((point) => (
              <li
                key={point}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[13.5px] font-medium text-foreground-muted"
              >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
                {point}
              </li>
            ))}
          </ul>

          {/* יציאה אל הספר — למי שלא רוצה לענות על דבר. חובה: מסך שמבקש
              קלט חייב להציע גם דרך שאינה דורשת אותו. */}
          <p className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14.5px]">
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              או פשוט ראו מה יש בספר
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/preview"
              className="text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              קראו טעימה
            </Link>
          </p>
        </header>
      </GuidanceIntro>

      <div className="enter" style={{ animationDelay: "160ms" }}>
        <AskRoute initialStation={initialStation} />
      </div>
    </GuidanceFocusProvider>
  );
}
