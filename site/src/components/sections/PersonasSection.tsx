"use client";

import { UserRound, HeartCrack, RotateCcw, Home } from "lucide-react";

import { personas, type PersonaId } from "@/content/personas";
import { usePersona } from "@/components/persona/PersonaProvider";
import { Container } from "@/components/shared/Container";

/** אייקון-דודל קווי לכל פרסונה. */
const ICONS: Record<PersonaId, typeof UserRound> = {
  single: UserRound,
  breakup: HeartCrack,
  divorced: RotateCcw,
  married: Home,
};

/**
 * „למי הספר הזה” — ארבעה עולמות, אותו קוד. כל כרטיס בוחר את הפרסונה (או מבטל),
 * והבחירה מתאימה את הקופי, ה-CTA והבר הדביק לאורך האתר. הבחירה נשמרת בין העמודים.
 */
export function PersonasSection() {
  const { personaId, setPersona } = usePersona();

  return (
    <section id="who" className="scroll-mt-20 py-20 sm:py-24" aria-labelledby="who-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">למי הספר הזה</span>
          <h2 id="who-heading" className="type-h2 mt-4">
            אותו קוד — ארבעה עולמות
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">
            אותו שורש בעיה, ארבעה מצבים שונים לגמרי. בחרו את שלכם, והאתר ידבר אליכם
            בשפה שלו.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {personas.map((p) => {
            const Icon = ICONS[p.id];
            const active = personaId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPersona(active ? null : p.id, "section")}
                className={`group rounded-2xl border p-6 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  active
                    ? "border-brand bg-brand-muted/40"
                    : "border-border bg-surface hover:border-brand/40 hover:bg-surface-muted"
                }`}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-muted text-brand">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-serif text-[1.2rem] font-semibold text-foreground">
                  {p.cardTitle}
                </h3>
                <p className="type-quote mt-2 text-[1.02rem] italic leading-relaxed text-foreground-muted">
                  {p.pain}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-hover">
                  {active ? "נבחר — האתר מותאם אליכם" : "זה אני"}
                </span>
              </button>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
