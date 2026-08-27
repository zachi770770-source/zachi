import type { ReaderProofMime } from "@/lib/reader/proof";

/** מצב ההפעלה — לעולם לא מוצג „מאומת” לפני approval אמיתי. */
export type ReaderClaimStatus = "pending" | "approved" | "rejected";

/** יצירת הפעלה חדשה במצב pending, כולל הוכחת-הרכישה (bytes פרטיים בשרת). */
export type ReaderClaimCreateInput = {
  emailNormalized: string;
  consentVersion: string;
  proof: { mime: ReaderProofMime; bytes: Buffer };
};

/** רשומת-הפעלה מאושרת (לאחר approval + החלפת-אסימון) — לשער-הכניסה לערכה. */
export type ReaderApprovedClaim = {
  emailNormalized: string;
};

/** פריט בתור-הבדיקה הידני (ללא bytes — רק מטא-דאטה). */
export type ReaderPendingClaim = {
  emailNormalized: string;
  status: ReaderClaimStatus;
  proofMime: ReaderProofMime | null;
  proofSize: number | null;
  createdAt: Date;
};

/** הוכחת-רכישה לצפייה בבדיקה הידנית (מוגן server-side, לעולם לא URL ציבורי). */
export type ReaderProofBlob = {
  mime: ReaderProofMime;
  bytes: Buffer;
};

/**
 * מאגר הפעלות ערכת-הקורא. אחסון מתמשך (Postgres) בפרודקשן; מימוש-זיכרון
 * לבדיקות בלבד. הוכחת-הרכישה אינה נכס ציבורי — נשמרת שרת-בלבד ונמחקת לאחר
 * ההכרעה (מינימום PII).
 */
export interface ReaderClaimRepository {
  /** יצירת/עדכון הפעלה ל-pending עם הוכחה חדשה (idempotent לפי email). */
  createPending(input: ReaderClaimCreateInput): Promise<void>;
  /** רשימת הפעלות ממתינות לבדיקה (מטא-דאטה בלבד). */
  listPending(limit: number): Promise<ReaderPendingClaim[]>;
  /** שליפת הוכחת-הרכישה לצפייה בבדיקה (או null אם אין/נמחקה). */
  getProof(emailNormalized: string): Promise<ReaderProofBlob | null>;
  /**
   * אישור ידני: מסמן approved, שומר את ה-hash של אסימון-הגישה + תפוגה, מוחק את
   * ה-bytes של ההוכחה (כבר לא נחוצים), ומחזיר את הרשומה — או null אם אין הפעלה.
   */
  approve(emailNormalized: string, accessTokenHash: string, expiresAt: Date): Promise<ReaderApprovedClaim | null>;
  /** דחייה ידנית: מסמן rejected, מוחק הוכחה ואסימון. */
  reject(emailNormalized: string): Promise<void>;
  /** איתור הפעלה מאושרת לפי hash של אסימון-הגישה (סשן העוגייה) — לא פג. */
  findApprovedByAccessTokenHash(accessTokenHash: string): Promise<ReaderApprovedClaim | null>;
}
