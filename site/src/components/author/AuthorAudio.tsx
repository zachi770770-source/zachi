"use client";

import * as React from "react";
import { Mic, FileText } from "lucide-react";

import { siteConfig } from "@/config/site";
import { authorAudio } from "@/content/sample";
import { authorContent } from "@/content/author";

/**
 * „למה כתבתי את הספר הזה” — רכיב שמע נגיש בקולו של המחבר.
 *
 * אין הפעלה אוטומטית. כל עוד אין קובץ שמע אמיתי (siteConfig.author.audioSrc
 * ריק) מוצג placeholder מכובד עם התמלול המלא בלבד — אין לייצר קול מלאכותי.
 * כשמוזן קובץ אמיתי: נגן נטיבי נגיש עם preload="none" (טעינה עצלה), כפתור
 * הפעלה ברור, ותמלול מלא כחלופת כתוביות. התמלול תמיד זמין וקריא.
 */
export function AuthorAudio() {
  const src = siteConfig.author.audioSrc;

  return (
    <section className="mx-auto mt-16 max-w-[64ch]" aria-labelledby="author-audio-heading">
      <span className="kicker">{authorAudio.eyebrow}</span>
      <h2
        id="author-audio-heading"
        className="mt-4 font-serif text-2xl font-semibold text-foreground"
      >
        {authorAudio.title}
      </h2>

      <div className="mt-5 rounded-3xl border border-border bg-surface-muted p-6 sm:p-7">
        {src ? (
          <audio
            controls
            preload="none"
            className="w-full"
            aria-describedby="author-audio-transcript"
          >
            <source src={src} />
            הדפדפן שלכם אינו תומך בנגן השמע. אפשר לקרוא את התמלול במקום.
          </audio>
        ) : (
          <div className="flex items-start gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand-hover"
              aria-hidden="true"
            >
              <Mic className="h-5 w-5" />
            </span>
            <p className="text-[15px] leading-relaxed text-foreground-muted">
              {authorAudio.pendingNote}
            </p>
          </div>
        )}
      </div>

      <details className="group mt-4" open={!src}>
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md py-2 text-[15px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <FileText className="h-4 w-4" aria-hidden="true" />
          {authorAudio.transcriptToggle}
        </summary>
        <div
          id="author-audio-transcript"
          className="mt-3 flex flex-col gap-4 border-s-2 border-border ps-5"
        >
          {authorContent.fullBio.map((paragraph, index) => (
            <p key={index} className="text-[1.05rem] leading-[1.8] text-foreground/90">
              {paragraph}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}
