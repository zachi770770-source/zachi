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
  city: z.string().trim().min(2, "יש להזין יישוב").max(60),
  street: z.string().trim().min(2, "יש להזין רחוב").max(80),
  houseNumber: z.string().trim().min(1, "יש להזין מספר בית").max(10),
  apartment: z.string().trim().max(10).optional().or(z.literal("")),
  zip: z.string().trim().max(10).optional().or(z.literal("")),
  courierNotes: z.string().trim().max(300).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(20),
  giftDedication: z.string().trim().max(200).optional().or(z.literal("")),
  agreeToTerms: z
    .boolean()
    .refine((v) => v === true, "יש לאשר את תנאי השימוש כדי להמשיך"),
  marketingConsent: z.boolean(),
  idempotencyKey: z.string().min(10),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
