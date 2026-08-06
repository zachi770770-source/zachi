"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircleQuestion, ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { compassQuiz } from "@/content/compass";
import { trackEvent } from "@/lib/analytics";

/**
 * מקטע „שאל את הספר” בבית (#where) — הזמנה יחידה למנוע ההכוונה האחד (AskRoute),
 * בלי שאלון נפרד בעמוד הבית. הכפתור הראשי פותח את חלונית „שאל את הספר” באותו
 * עמוד (event: open-compass); קישור-המשנה מוביל לעמוד המלא /compass (עובד גם
 * ללא JS). כך יש באתר מנגנון-הכוונה אחד בלבד — לא שני שאלונים.
 */
export function AskInvite() {
  const openDrawer = () => {
    trackEvent("ask_open_home");
    window.dispatchEvent(new CustomEvent("open-compass"));
  };

  return (
    <section
      id="where"
      className="scroll-mt-20 py-16 sm:py-20"
      aria-labelledby="where-heading"
    >
      <Container>
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">
            <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
            {compassQuiz.eyebrow}
          </span>
          <h2 id="where-heading" className="type-h2 mt-4">
            לא בטוחים מאיפה להתחיל? שאלו את הספר
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">
            3–4 שאלות קצרות, ותדעו מאיזו תחנה מתאים לכם להיכנס: לפני קשר, בניית
            קשר או בתוך קשר — ואם נפרדתם, יש כאן גם שער מעבר. לא שאלון אישיות ולא
            צ׳אט, אלא הכוונה מתוך הספר.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button size="lg" className="px-8" onClick={openDrawer}>
              {compassQuiz.ask.title}
            </Button>
            <Link
              href="/compass"
              className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              לעמוד המלא של „שאל את הספר”
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
