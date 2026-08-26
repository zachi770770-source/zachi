import { z } from "zod";

/** גרסת ההסכמה לתיעוד consent (פרטיות). */
export const READER_CLAIM_CONSENT_VERSION = "2026-08-v1";

/** מאיפה הופעלה ההפעלה — שיוך בלבד, ללא PII. */
export const READER_CLAIM_SOURCES = ["reader", "book", "preview", "email"] as const;
export type ReaderClaimSource = (typeof READER_CLAIM_SOURCES)[number];

/**
 * הפעלת ערכת הקורא — „הוכחת רכישה” בשלב הראשון היא *מזהה הזמנה* מ-Amazon
 * (טקסט קצר), לא העלאת קובץ: לפרויקט אין אחסון-קבצים פרטי, והעלאת קבלות
 * ללא אחסון מאובטח נוגדת את דרישות הפרטיות. מבקשים רק מידע נחוץ: שם, אימייל,
 * מזהה-הזמנה, והסכמה. `company` הוא honeypot נסתר.
 */
export const readerClaimSchema = z.object({
  name: z.string().trim().min(1, "יש להזין שם").max(80, "השם ארוך מדי"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("יש להזין כתובת אימייל תקינה")
    .max(254, "כתובת האימייל ארוכה מדי"),
  /** מזהה הזמנה / אישור רכישה מאמזון — מזהה בלבד, לא קובץ. */
  orderRef: z
    .string()
    .trim()
    .min(6, "יש להזין מזהה הזמנה מאמזון")
    .max(60, "מזהה ההזמנה ארוך מדי"),
  consent: z
    .boolean()
    .refine((v) => v === true, "יש לאשר כדי שנוכל לשלוח לכם את גישת הערכה"),
  source: z.enum(READER_CLAIM_SOURCES).default("reader"),
  /** honeypot — אמור להישאר ריק. */
  company: z.string().max(120).optional().or(z.literal("")),
});

export type ReaderClaimInput = z.infer<typeof readerClaimSchema>;
