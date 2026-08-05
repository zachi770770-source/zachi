"use client";

import * as React from "react";

import {
  PERSONA_STORAGE_KEY,
  isPersonaId,
  type PersonaId,
} from "@/content/personas";
import { trackEvent } from "@/lib/analytics";

type PersonaContextValue = {
  personaId: PersonaId | null;
  setPersona: (id: PersonaId | null) => void;
};

const PersonaContext = React.createContext<PersonaContextValue | null>(null);

/**
 * מחזיק את פרסונת-הגולש הנבחרת ומשתף אותה לכל האתר. הבחירה נשמרת מקומית
 * (localStorage, מזהה בלבד) ולכן נשמרת בין עמודים וביקורים. אין נתונים אישיים.
 * ברירת המחדל (SSR/טרם-בחירה) היא null — הקופי הכללי מוצג, ומתעדכן אחרי הבחירה.
 */
export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = React.useState<PersonaId | null>(null);

  // קריאה בטוחה מ-localStorage אחרי mount. ה-setState נדחה ל-rAF (מחוץ לגוף
  // האפקט) — צד-לקוח בלבד, בלי אי-התאמת הידרציה ובלי „set-state-in-effect”.
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(PERSONA_STORAGE_KEY);
        if (isPersonaId(raw)) setPersonaId(raw);
      } catch {
        /* אחסון חסום — ממשיכים בלי שמירה */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const setPersona = (id: PersonaId | null) => {
    setPersonaId(id);
    try {
      if (id) window.localStorage.setItem(PERSONA_STORAGE_KEY, id);
      else window.localStorage.removeItem(PERSONA_STORAGE_KEY);
    } catch {
      /* אחסון חסום — ממשיכים בלי שמירה */
    }
    if (id) trackEvent("persona_select", { persona: id });
  };

  return (
    <PersonaContext.Provider value={{ personaId, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const ctx = React.useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used within <PersonaProvider>");
  }
  return ctx;
}
