import { z } from "zod";

/** גרסת ההסכמה לתיעוד consent (פרטיות). */
export const READER_CLAIM_CONSENT_VERSION = "2026-08-v1";

/**
 * שדות-הטקסט של הפעלת ערכת-הקורא. הזרימה: רכישה באמזון → העלאת הוכחת-רכישה →
 * pending → בדיקה ידנית → approved/rejected. מבקשים מינימום PII: אימייל
 * והסכמה בלבד (אין שם — הבודק מזהה מול ההוכחה עצמה). קובץ ההוכחה מאומת בנפרד
 * בצד השרת (ראו lib/reader/proof.ts). `company` הוא honeypot נסתר.
 */
export const readerClaimSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("יש להזין כתובת אימייל תקינה")
    .max(254, "כתובת האימייל ארוכה מדי"),
  consent: z
    .boolean()
    .refine((v) => v === true, "יש לאשר כדי שנוכל לשלוח לכם את גישת הערכה"),
  /** honeypot — אמור להישאר ריק. */
  company: z.string().max(120).optional().or(z.literal("")),
});

export type ReaderClaimInput = z.infer<typeof readerClaimSchema>;
