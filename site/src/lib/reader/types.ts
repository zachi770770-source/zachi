/**
 * מודל-הנתונים של הפעלת ערכת-הקורא. ההפעלה מיידית (קוד תקף → גישה), אין
 * pending/approval. שומרים מינימום PII: אימייל + גרסת-הסכמה בלבד. הגישה עצמה
 * מנוהלת כסשן: במסד נשמר *רק* ה-hash של אסימון-הסשן, לצד תפוגה/ביטול.
 */

export type ReaderActivationInput = {
  emailNormalized: string;
  consentVersion: string;
  /** hash (SHA-256) של אסימון-הסשן — לעולם לא האסימון הגולמי. */
  sessionTokenHash: string;
  sessionExpiresAt: Date;
};

/** סשן תקף כפי שהוא מוחזר מהמאגר — חושף רק את המינימום הדרוש לאישור גישה. */
export type ReaderSession = {
  emailNormalized: string;
};

/**
 * מאגר גישת ערכת-הקורא. אחסון מתמשך (Postgres) בפרודקשן; מימוש-זיכרון לבדיקות
 * בלבד. אין כאן „הוכחת-רכישה” ואין מזהי-הזמנה — רק אימייל, הסכמה, ו-hash של סשן.
 */
export interface ReaderAccessRepository {
  /**
   * הפעלה: upsert לפי email_normalized (רענון הסכמה) והחלפת הסשן הפעיל בסשן
   * חדש (hash + תפוגה, מבטל ביטול קודם). אידמפוטנטי — הגשה חוזרת מפעילה מחדש.
   */
  activate(input: ReaderActivationInput): Promise<void>;
  /** איתור סשן תקף (לא פג ולא בוטל) לפי hash של האסימון — לשער-הכניסה לערכה. */
  findValidSession(sessionTokenHash: string): Promise<ReaderSession | null>;
  /** ביטול סשן לפי hash (logout/אכיפה עתידית). */
  revokeSession(sessionTokenHash: string): Promise<void>;
}
