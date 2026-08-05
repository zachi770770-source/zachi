import type { WaitlistSource } from "@/lib/validation/waitlist";
import type { PersonaId, PersonaSource } from "@/content/personas";

export type WaitlistAddInput = {
  emailNormalized: string;
  emailOriginal: string;
  source: WaitlistSource;
  consentVersion: string;
  /** הפרסונה שנבחרה בזמן ההרשמה (או null) — שיוך שיווקי בלבד. */
  persona?: PersonaId | null;
  /** מאיפה נבחרה הפרסונה (hero/section/url/stored/none). */
  personaSource?: PersonaSource | null;
};

/**
 * מאגר רשימת ההמתנה. אחסון מתמשך בלבד (Postgres). אין לשמור כתובות
 * בזיכרון/קובץ/לקוח בפרודקשן.
 */
export interface WaitlistRepository {
  /**
   * הוספה אידמפוטנטית: הרשמה חוזרת של אותו אימייל אינה יוצרת כפילות
   * (upsert לפי email_normalized).
   */
  add(input: WaitlistAddInput): Promise<void>;
  /** סימון נרשם כ-unsubscribed (שרתי בלבד). */
  unsubscribe(emailNormalized: string): Promise<void>;
}
