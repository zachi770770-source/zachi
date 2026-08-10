"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircleQuestion } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { askBook } from "@/content/compass";
import type { AskStationId } from "@/content/askRoute";

/**
 * כניסה לעוזר הדטרמיניסטי של הספר („מה הספר אומר על המצב שלי?”). כשידוע ה-station
 * הוא נישא ב-`?station=` כדי שהמנוע לא ישאל שוב „איפה אתם?”. השם הפנימי (Compass/
 * AskRoute/analytics) נשמר; רק השפה הגלויה היא החדשה. אירוע אנונימי (מזהה תחנה בלבד).
 *
 * `prompt` מוסיף שורת-מיסגור קצרה מעל ה-CTA (למשל אחרי „רגע של מראה”).
 */
export function AskBookLink({
  station,
  prompt,
  className,
}: {
  station?: AskStationId;
  prompt?: string;
  className?: string;
}) {
  const href = station ? `/compass?station=${station}` : "/compass";
  const link = (
    <Link
      href={href}
      onClick={() => trackEvent("ask_book_clicked", { station: station ?? "none" })}
      className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <MessageCircleQuestion className="h-4 w-4 text-brand" aria-hidden="true" />
      {askBook.cta}
      <ArrowLeft
        className="h-3.5 w-3.5 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );

  if (!prompt) return className ? <div className={className}>{link}</div> : link;

  return (
    <div className={className}>
      <p className="text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
        {prompt}
      </p>
      <div className="mt-2">{link}</div>
    </div>
  );
}
