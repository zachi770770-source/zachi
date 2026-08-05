"use client";

import * as React from "react";

import {
  PERSONA_STORAGE_KEY,
  PERSONA_SOURCE_STORAGE_KEY,
  PERSONA_QUERY_PARAM,
  isPersonaId,
  isPersonaSource,
  type PersonaId,
  type PersonaSource,
} from "@/content/personas";
import { trackEvent } from "@/lib/analytics";

type PersonaContextValue = {
  personaId: PersonaId | null;
  /** מאיפה נבחרה הפרסונה הפעילה (לשיוך רשומות רשימת-ההמתנה). */
  source: PersonaSource;
  setPersona: (id: PersonaId | null, source?: PersonaSource) => void;
};

const PersonaContext = React.createContext<PersonaContextValue | null>(null);

/** כתיבה ל-localStorage (מזהה + מקור). שקטה כשהאחסון חסום. */
function persist(id: PersonaId | null, source: PersonaSource) {
  try {
    if (id) {
      window.localStorage.setItem(PERSONA_STORAGE_KEY, id);
      window.localStorage.setItem(PERSONA_SOURCE_STORAGE_KEY, source);
    } else {
      window.localStorage.removeItem(PERSONA_STORAGE_KEY);
      window.localStorage.removeItem(PERSONA_SOURCE_STORAGE_KEY);
    }
  } catch {
    /* אחסון חסום — ממשיכים בלי שמירה */
  }
}

/**
 * מחזיק את פרסונת-הגולש הנבחרת ומשתף אותה לכל האתר. הבחירה נשמרת מקומית
 * (localStorage, מזהה + מקור בלבד) ולכן נשמרת בין עמודים וביקורים. אין נתונים אישיים.
 *
 * ברירת המחדל בשרת וברינדור-הלקוח הראשון היא null — זהה ל-SSR, כך שאין אי-התאמת
 * הידרציה (והקונסולה נשארת נקייה). מיד אחרי ה-mount נפתרת הפרסונה לפי סדר עדיפות:
 *   1) פרמטר ?persona= ב-URL (כניסה ייעודית ממודעה/פוסט) — דורס את השמור.
 *   2) הבחירה השמורה ב-localStorage.
 * הבזק כותרת-המשנה בעמוד הבית נמנע בנפרד ע"י סקריפט קדם-צביעה (PersonaSubheadScript).
 */
export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [personaId, setPersonaId] = React.useState<PersonaId | null>(null);
  const [source, setSource] = React.useState<PersonaSource>("none");

  // פתירה בטוחה אחרי mount. ה-setState נדחה ל-rAF (מחוץ לגוף האפקט) — צד-לקוח
  // בלבד, בלי אי-התאמת הידרציה ובלי „set-state-in-effect”.
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const fromUrl = new URLSearchParams(window.location.search).get(
          PERSONA_QUERY_PARAM
        );
        if (isPersonaId(fromUrl)) {
          // כניסה ממודעה/פוסט ייעודי — דורסת את השמור ונשמרת להמשך המסע.
          setPersonaId(fromUrl);
          setSource("url");
          persist(fromUrl, "url");
          document.documentElement.setAttribute("data-persona", fromUrl);
          return;
        }
        const savedId = window.localStorage.getItem(PERSONA_STORAGE_KEY);
        if (isPersonaId(savedId)) {
          const savedSrc = window.localStorage.getItem(
            PERSONA_SOURCE_STORAGE_KEY
          );
          setPersonaId(savedId);
          setSource(isPersonaSource(savedSrc) ? savedSrc : "stored");
          document.documentElement.setAttribute("data-persona", savedId);
        }
      } catch {
        /* אחסון/URL חסום — ממשיכים בלי שמירה */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const setPersona = (
    id: PersonaId | null,
    nextSource: PersonaSource = "none"
  ) => {
    setPersonaId(id);
    setSource(id ? nextSource : "none");
    persist(id, id ? nextSource : "none");
    try {
      if (id) document.documentElement.setAttribute("data-persona", id);
      else document.documentElement.removeAttribute("data-persona");
    } catch {
      /* ללא DOM — לא קריטי */
    }
    if (id) {
      trackEvent("persona_select", { persona: id, persona_source: nextSource });
    }
  };

  return (
    <PersonaContext.Provider value={{ personaId, source, setPersona }}>
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

const NO_PERSONA: PersonaContextValue = {
  personaId: null,
  source: "none",
  setPersona: () => {},
};

/**
 * גרסה סובלנית של usePersona: מחזירה ברירת-מחדל ריקה כשאין ספק בהקשר (למשל
 * ברינדור בודד בבדיקות), במקום לזרוק. לצרכני-קצה כמו הטופס וה-FAQ שעשויים
 * להתרנדר גם מחוץ ל-Provider.
 */
export function usePersonaOptional(): PersonaContextValue {
  return React.useContext(PersonaContext) ?? NO_PERSONA;
}
