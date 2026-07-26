"use client";

import { ChevronDown } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import type { FaqItem } from "@/content/faq";

/**
 * שאלות נפוצות מבוססות <details>/<summary> נטיביים: נגישים במקלדת, קריאים
 * וניתנים לפתיחה גם ללא JavaScript, והתשובות נמצאות ב-HTML לצורך סריקה.
 * מעקב האנליטיקה הוא שיפור מתקדם בלבד (onToggle) ואינו נדרש לתפעול.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface">
      {items.map((item) => (
        <details
          key={item.id}
          className="group px-5"
          onToggle={(event) => {
            if (event.currentTarget.open) {
              trackEvent("faq_open", { question_id: item.id });
            }
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-[17px] font-semibold text-foreground [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            {item.question}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-brand transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="faq-answer pb-5 pe-8 text-base leading-relaxed text-foreground-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
