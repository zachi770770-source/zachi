import { z } from "zod";

const israeliPhoneRegex = /^0\d{1,2}-?\d{3}-?\d{4}$/;

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "יש להזין שם מלא")
    .max(80, "השם ארוך מדי"),
  phone: z
    .string()
    .trim()
    .regex(israeliPhoneRegex, "יש להזין מספר טלפון ישראלי תקין"),
  email: z.string().trim().toLowerCase().email("יש להזין כתובת אימייל תקינה"),
  city: z.string().trim().min(2, "יש להזין יישוב").max(60, "שם היישוב ארוך מדי"),
  street: z.string().trim().min(2, "יש להזין רחוב").max(80, "שם הרחוב ארוך מדי"),
  houseNumber: z.string().trim().min(1, "יש להזין מספר בית").max(10, "מספר הבית ארוך מדי"),
  apartment: z
    .string()
    .trim()
    .max(10, "מספר הדירה ארוך מדי")
    .optional()
    .or(z.literal("")),
  zip: z.string().trim().max(10, "המיקוד ארוך מדי").optional().or(z.literal("")),
  courierNotes: z
    .string()
    .trim()
    .max(300, "ההערה ארוכה מדי (עד 300 תווים)")
    .optional()
    .or(z.literal("")),
  quantity: z
    .coerce
    .number()
    .int("הכמות חייבת להיות מספר שלם")
    .min(1, "יש לבחור כמות של עותק אחד לפחות")
    .max(20, "לא ניתן להזמין יותר מ-20 עותקים בהזמנה אחת"),
  giftDedication: z
    .string()
    .trim()
    .max(200, "ההקדשה ארוכה מדי (עד 200 תווים)")
    .optional()
    .or(z.literal("")),
  agreeToTerms: z
    .boolean()
    .refine((v) => v === true, "יש לאשר את תנאי השימוש כדי להמשיך"),
  marketingConsent: z.boolean(),
  idempotencyKey: z.string().min(10, "מזהה בקשה לא תקין"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
