"use client";

import { personas } from "@/content/personas";
import { usePersona } from "@/components/persona/PersonaProvider";

/**
 * ארבעת כפתורי הפילוח (Pills). לחיצה בוחרת פרסונה (או מבטלת בחירה חוזרת), והבחירה
 * מתאימה את הקופי, ה-CTA והבר הדביק לאורך האתר. נגיש: role=group + aria-pressed.
 */
export function PersonaPicker({ className }: { className?: string }) {
  const { personaId, setPersona } = usePersona();

  return (
    <div className={className}>
      <p className="text-[13.5px] font-semibold text-foreground-muted">
        איפה אתם עכשיו?
      </p>
      <div
        role="group"
        aria-label="בחרו את המצב שמתאים לכם"
        className="mt-2.5 flex flex-wrap gap-2"
      >
        {personas.map((p) => {
          const active = personaId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPersona(active ? null : p.id)}
              className={`min-h-[40px] rounded-full border px-4 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border-strong bg-surface text-foreground hover:border-brand/50 hover:bg-surface-muted"
              }`}
            >
              {p.pill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
