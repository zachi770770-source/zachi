import { z } from "zod";

export const newsletterSchema = z.object({
  firstName: z.string().trim().min(2, "יש להזין שם פרטי").max(60, "השם ארוך מדי"),
  email: z.string().trim().toLowerCase().email("יש להזין כתובת אימייל תקינה"),
  contentConsent: z
    .boolean()
    .refine((v) => v === true, "יש לאשר קבלת התוכן כדי להמשיך"),
  marketingConsent: z.boolean(),
  /** שדה מלכודת לבוטים - חייב להישאר ריק. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
