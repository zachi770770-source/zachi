"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircleQuestion } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import type { AskStationId } from "@/content/askRoute";

/**
 * „שאל את הספר” כפעולה משנית בעמוד-מסע — נושא את הקשר-המצב (`?station=`), כדי
 * שהמנוע לא ישאל שוב „איפה אתם?”. אירוע אנונימי (מזהה תחנה בלבד).
 */
export function AskBookLink({ station }: { station: AskStationId }) {
  return (
    <Link
      href={`/compass?station=${station}`}
      onClick={() => trackEvent("ask_book_clicked", { station })}
      className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <MessageCircleQuestion className="h-4 w-4 text-brand" aria-hidden="true" />
      שאל את הספר
      <ArrowLeft
        className="h-3.5 w-3.5 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );
}
