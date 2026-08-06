"use client";

import { ChevronDown } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import type { FaqItem } from "@/content/faq";
import { usePersonaOptional } from "@/components/persona/PersonaProvider";

/**
 * שאלות נפוצות מבוססות <details>/<summary> נטיביים: נגישים במקלדת, קריאים
 * וניתנים לפתיחה גם ללא JavaScript, והתשובות נמצאות ב-HTML לצורך סריקה.
 * מעקב האנליטיקה הוא שיפור מתקדם בלבד (onToggle) ואינו נדרש לתפעול.
 *
 * התאמה-אישית: כשנבחרה פרסונה, השאלות המשויכות לה מוקדמות לראש הרשימה ומסומנות
 * „מותאם למצב שלכם”. הסידור מתעדכן רק אחרי ה-mount (הרינדור הראשון זהה ל-SSR),
 * כך שאין אי-התאמת הידרציה. כל השאלות נשארות גלויות — הסדר בלבד משתנה.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const { personaId } = usePersonaOptional();

  // מיון יציב: פריטי הפרסונה הפעילה ראשונים; שאר הפריטים בסדרם המקורי.
  const ordered = personaId
    ? items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          const aMatch = a.item.persona === personaId ? 0 : 1;
          const bMatch = b.item.persona === personaId ? 0 : 1;
          return aMatch - bMatch || a.index - b.index;
        })
        .map((x) => x.item)
    : items;

  return (
    <div className="divide-y divide-border border-y border-border">
      {ordered.map((item) => {
        const matched = !!personaId && item.persona === personaId;
        return (
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
              <span className="flex flex-col gap-1">
                {matched ? (
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-brand-hover">
                    מותאם למצב שלכם
                  </span>
                ) : null}
                {item.question}
              </span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-brand transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="faq-answer pb-6 pe-8 text-[1.05rem] leading-[1.75] text-foreground-muted">
              {item.answer}
            </p>
          </details>
        );
      })}
    </div>
  );
}
