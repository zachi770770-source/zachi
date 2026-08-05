/**
 * שמירה מקומית מינימלית של תוצאת „המצפן” לביקור חוזר.
 *
 * שומרים *רק* את מזהה התחנה ואת מצב ההשלמה — לא את התשובות המפורטות ולא שום
 * מידע רגיש. כל גישה ל-localStorage עטופה ב-try/catch: אם האחסון חסום (מצב
 * פרטי / הרשאות), מלא, או פגום — הפונקציות מחזירות null / no-op בשקט, והאתר
 * ממשיך לעבוד כרגיל (כאילו אין שמירה).
 */

import {
  COMPASS_STATION_ORDER,
  type CompassStationId,
} from "@/lib/compass/quiz";

const STORAGE_KEY = "mlc.compass.v1";

export interface CompassSaved {
  stationId: CompassStationId;
  completed: boolean;
}

function isStationId(v: unknown): v is CompassStationId {
  return typeof v === "string" && (COMPASS_STATION_ORDER as string[]).includes(v);
}

/** קורא בבטחה — מחזיר null אם אין / חסום / פגום / לא בפורמט הצפוי. */
export function loadCompass(): CompassSaved | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !isStationId((parsed as Record<string, unknown>).stationId) ||
      (parsed as Record<string, unknown>).completed !== true
    ) {
      return null;
    }
    const stationId = (parsed as Record<string, unknown>).stationId as CompassStationId;
    return { stationId, completed: true };
  } catch {
    return null;
  }
}

/** שומר בבטחה — no-op אם האחסון אינו זמין. */
export function saveCompass(stationId: CompassStationId): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (!isStationId(stationId)) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stationId, completed: true }),
    );
  } catch {
    /* אחסון חסום/מלא — ממשיכים בלי שמירה */
  }
}

/** מנקה את השמירה (התחלה מחדש). */
export function clearCompass(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
