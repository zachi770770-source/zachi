import type { WaitlistSource } from "@/lib/validation/waitlist";

export type WaitlistAddInput = {
  emailNormalized: string;
  emailOriginal: string;
  source: WaitlistSource;
  consentVersion: string;
};

/**
 * מאגר רשימת ההמתנה. אחסון מתמשך בלבד (Postgres). אין לשמור כתובות
 * בזיכרון/קובץ/לקוח בפרודקשן.
 */
/** תוצאת הוספה: האם נוספה רשומה חדשה בפועל, או שהכתובת כבר הייתה קיימת. */
export type WaitlistAddResult = {
  /** true רק כאשר נוצרה רשומה חדשה; false בהרשמה חוזרת (idempotent update). */
  created: boolean;
};

export interface WaitlistRepository {
  /**
   * הוספה אידמפוטנטית: הרשמה חוזרת של אותו אימייל אינה יוצרת כפילות
   * (upsert לפי email_normalized). מחזיר `created: true` רק כאשר נוצרה
   * רשומה חדשה, כך שהקורא יכול להבחין בין הרשמה חדשה לכתובת קיימת.
   */
  add(input: WaitlistAddInput): Promise<WaitlistAddResult>;
  /** סימון נרשם כ-unsubscribed (שרתי בלבד). */
  unsubscribe(emailNormalized: string): Promise<void>;
}
