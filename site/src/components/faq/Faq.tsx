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
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details
          key={item.id}
          className="group"
          onToggle={(event) => {
            if (event.currentTarget.open) {
              trackEvent("faq_open", { question_id: item.id });
            }
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start text-[1.15rem] font-semibold text-foreground transition-colors [&::-webkit-details-marker]:hidden hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            {item.question}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-brand transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="faq-answer pb-6 pe-8 text-[1.05rem] leading-[1.75] text-foreground-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
