"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getPersona } from "@/content/personas";
import { usePersona } from "@/components/persona/PersonaProvider";

/** כותרת-המשנה ב-Hero: מותאמת לפרסונה שנבחרה, אחרת נופלת ל-fallback הכללי. */
export function PersonaHeroSubhead({ fallback }: { fallback: string }) {
  const { personaId } = usePersona();
  const persona = getPersona(personaId);
  return <>{persona ? persona.hook : fallback}</>;
}

/**
 * ה-CTA הדינמי ב-Hero: מופיע רק כשנבחרה פרסונה, עם המשפט הרגשי שלה, ומוביל
 * לרשימת ההמתנה (המרת-המאקרו בטרום-השקה). ללא פרסונה — לא מרונדר (ה-CTA
 * הרגיל „קראו טעימה” נשאר הפעולה הראשית).
 */
export function PersonaHeroCta() {
  const { personaId } = usePersona();
  const persona = getPersona(personaId);
  if (!persona) return null;

  return (
    <Link
      href={persona.ctaHref}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-7 text-[17px] font-semibold text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
    >
      {persona.ctaLabel}
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}
