import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "יש להזין שם").max(80),
  contact: z
    .string()
    .trim()
    .min(5, "יש להזין אימייל או טלפון ליצירת קשר")
    .max(120),
  subject: z.string().trim().min(2, "יש להזין נושא").max(150),
  message: z.string().trim().min(10, "ההודעה קצרה מדי").max(2000),
  /** שדה מלכודת לבוטים - חייב להישאר ריק. אינו מוצג למשתמשים אנושיים. */
  website: z.string().max(0, "בקשה נדחתה").optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
