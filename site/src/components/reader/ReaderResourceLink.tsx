"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { trackEvent } from "@/lib/analytics";

/**
 * קישור-משאב בערכת-הקורא — יורה `reader_resource_opened` (מזהה-משאב בלבד, ללא
 * PII) בעת פתיחה, ומנווט לתוכן האמיתי (/method/* או /guide/*). לא-חוסם: כשל
 * באנליטיקה לא מעכב את הניווט.
 */
export function ReaderResourceLink({
  id,
  href,
  title,
  summary,
}: {
  id: string;
  href: string;
  title: string;
  summary: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        try {
          trackEvent("reader_resource_opened", { resource: id });
        } catch {
          /* לא-קריטי */
        }
      }}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span>
        <span className="font-serif text-[15px] font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-[14px] leading-relaxed text-foreground/80 [text-wrap:pretty]">
          {summary}
        </span>
      </span>
      <ArrowLeft
        className="mt-1 h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
        aria-hidden="true"
      />
    </Link>
  );
}
