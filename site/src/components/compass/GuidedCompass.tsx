"use client";

import * as React from "react";
import { Compass } from "lucide-react";

import { compassQuiz } from "@/content/compass";
import { askUi, type AskStationId } from "@/content/askRoute";
import { AskRoute } from "@/components/interactive/AskRoute";
import { GuidanceFocusProvider, GuidanceIntro } from "@/components/guidance/GuidanceFocus";

const POINTS = ["2-3 שאלות קצרות", "בחירה מתוך תשובות", "נקודת פתיחה, לא אבחון"];

/**
 * המצפן המודרך כמשטח-הכוונה עם „מצב-תגובה”: קליפת-הפתיח (אייקון/כותרת/צ'יפים)
 * עטופה ב-GuidanceIntro ומתקפלת ברגע ש-AskRoute מגיע לתוצאה — כך שהתשובה הופכת
 * למוקד המסך במקום לשבת מתחת לכותרת שיווקית. הפתיח נושא את ה-h1; במצב-תשובה
 * ה-h1 עובר ל-AnswerView (h1 אחד תמיד).
 */
export function GuidedCompass({ initialStation }: { initialStation?: AskStationId }) {
  return (
    <GuidanceFocusProvider>
      <GuidanceIntro className="mb-10 sm:mb-12">
        <header className="enter-stagger mx-auto max-w-2xl text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-muted text-brand ring-1 ring-brand/15"
            aria-hidden="true"
          >
            <Compass className="h-6 w-6" />
          </span>
          <span className="kicker mt-6 justify-center">{askUi.eyebrow}</span>
          <h1 className="mt-4 font-serif type-hero text-foreground">
            {compassQuiz.ask.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-balance text-foreground-muted">
            {compassQuiz.ask.subtitle}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-[14px] italic text-foreground-muted">
            כאן לא שופטים אתכם, מבינים.
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
        </header>
      </GuidanceIntro>

      <div className="enter" style={{ animationDelay: "160ms" }}>
        <AskRoute initialStation={initialStation} />
      </div>
    </GuidanceFocusProvider>
  );
}
