import type { ReaderClaimSource } from "@/lib/validation/readerClaim";

/** מצב ההפעלה — לעולם לא מוצג „מאומת” לפני approval אמיתי. */
export type ReaderClaimStatus = "pending" | "approved" | "rejected";

export type ReaderClaimAddInput = {
  name: string;
  emailNormalized: string;
  emailOriginal: string;
  orderRef: string;
  source: ReaderClaimSource;
  consentVersion: string;
};

/** רשומת-הפעלה כפי שהיא מוחזרת מהמאגר (ללא חשיפת מידע מיותר). */
export type ReaderClaim = {
  emailNormalized: string;
  status: ReaderClaimStatus;
  /** אסימון-גישה לערכה — קיים רק לאחר approval. */
  accessToken: string | null;
};

/**
 * מאגר הפעלות ערכת-הקורא. אחסון מתמשך (Postgres) בפרודקשן; מימוש-זיכרון
 * לבדיקות בלבד. הוכחת-הרכישה (מזהה הזמנה) אינה נכס ציבורי — נשמרת שרת-בלבד.
 */
export interface ReaderClaimRepository {
  /**
   * יצירת הפעלה חדשה במצב `pending` (אידמפוטנטי לפי email_normalized: הגשה
   * חוזרת מעדכנת את הפרטים ומחזירה ל-pending, בלי ליצור כפילות).
   */
  createPending(input: ReaderClaimAddInput): Promise<void>;
  /**
   * אישור ידני: מסמן `approved`, מייצר `accessToken` (אם אין), ומחזיר את
   * הרשומה המעודכנת — או null אם אין הפעלה כזו.
   */
  approve(emailNormalized: string, accessToken: string): Promise<ReaderClaim | null>;
  /** דחייה ידנית. */
  reject(emailNormalized: string): Promise<void>;
  /** איתור הפעלה מאושרת לפי אסימון-גישה (לשער-הכניסה לערכה). */
  findByAccessToken(accessToken: string): Promise<ReaderClaim | null>;
}
