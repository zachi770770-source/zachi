/**
 * שמירה מקומית מינימלית של „שאל את הספר” — רק תחנה + דילמה, לצורך חזרה למסלול.
 *
 * לא נשמר טקסט אישי, לא הקשר-בטיחות ולא שום מידע רגיש. כל גישה עטופה ב-try/catch:
 * אחסון חסום/מלא/פגום → null / no-op בשקט. אין חשבון משתמש ואין שמירה בשרת.
 */

import { dilemmas, type AskStationId } from "@/content/askRoute";

const STORAGE_KEY = "mlc.ask.v1";

export interface AskSaved {
  stationId: AskStationId;
  dilemmaId: string;
}

/** קורא בבטחה — null אם אין / חסום / פגום / לא תואם. */
export function loadAsk(): AskSaved | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    if (!p || typeof p !== "object") return null;
    const o = p as Record<string, unknown>;
    const d = dilemmas.find((x) => x.id === o.dilemmaId);
    if (d && d.station === o.stationId) {
      return { stationId: d.station, dilemmaId: d.id };
    }
    return null;
  } catch {
    return null;
  }
}

/** שומר בבטחה — no-op אם האחסון אינו זמין. */
export function saveAsk(saved: AskSaved): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    /* אחסון חסום/מלא — ממשיכים בלי שמירה */
  }
}

/** מנקה את השמירה (איפוס ברור). */
export function clearAsk(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
