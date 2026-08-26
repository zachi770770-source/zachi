import { z } from "zod";

/** גרסת ההסכמה לתיעוד consent (פרטיות). */
export const READER_ACTIVATION_CONSENT_VERSION = "2026-08-v1";

/**
 * הפעלת ערכת-הקורא — מבוססת *קוד-הפעלה מתוך הספר* (proof-of-possession), לא
 * מזהה-הזמנה מאמזון: ל-KDP אין דרך לחשוף למחבר מזהי-הזמנה, ולכן „אימות רכישה”
 * לפי מספר-הזמנה אינו אמיתי. מבקשים מינימום PII: אימייל + הסכמה + הקוד.
 * `company` הוא honeypot נסתר.
 */
export const readerActivationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("יש להזין כתובת אימייל תקינה")
    .max(254, "כתובת האימייל ארוכה מדי"),
  /** קוד-ההפעלה שמופיע בתוך הספר. אורך גמיש; ההשוואה מנורמלת בצד השרת. */
  code: z
    .string()
    .trim()
    .min(4, "יש להזין את קוד ההפעלה מהספר")
    .max(40, "קוד ההפעלה ארוך מדי"),
  consent: z
    .boolean()
    .refine((v) => v === true, "יש לאשר כדי שנוכל לשלוח לכם את גישת הערכה"),
  /** honeypot — אמור להישאר ריק. */
  company: z.string().max(120).optional().or(z.literal("")),
});

export type ReaderActivationInput = z.infer<typeof readerActivationSchema>;
