import { z } from "zod";

import { siteConfig } from "@/config/site";

/**
 * מספר טלפון ישראלי תקין: מכיל רק ספרות, רווחים ומקפים, מתחיל ב-0,
 * וכולל 9-10 ספרות בפועל (לאחר הסרת מפרידים).
 */
function isValidIsraeliPhone(raw: string): boolean {
  if (!/^[\d\s-]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") && digits.length >= 9 && digits.length <= 10;
}

/** רשימת מזהי המהדורות התקינים, נגזרת מה-config. */
const formatIds = Object.keys(siteConfig.products.formats) as [
  string,
  ...string[]
];

/**
 * שדות הטופס. המהדורה הדיגיטלית דורשת שם ואימייל בלבד; מהדורה מודפסת או
 * חבילה דורשות גם כתובת למשלוח. שדות הכתובת מוגדרים כאן כאופציונליים,
 * ונאכפים באופן מותנה דרך `requireShippingWhenNeeded` רק כאשר הפורמט
 * הנבחר דורש משלוח.
 */
export const checkoutObject = z.object({
  format: z.enum(formatIds),
  fullName: z.string().trim().min(2, "יש להזין שם מלא").max(80, "השם ארוך מדי"),
  email: z.string().trim().toLowerCase().email("יש להזין כתובת אימייל תקינה"),
  quantity: z
    .coerce
    .number()
    .int("הכמות חייבת להיות מספר שלם")
    .min(1, "יש לבחור כמות של עותק אחד לפחות")
    .max(20, "לא ניתן להזמין יותר מ-20 עותקים בהזמנה אחת"),

  // שדות משלוח - נדרשים רק כאשר הפורמט דורש משלוח (ראו הרפיינמנט למטה).
  phone: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().max(60, "שם היישוב ארוך מדי").optional().or(z.literal("")),
  street: z.string().trim().max(80, "שם הרחוב ארוך מדי").optional().or(z.literal("")),
  houseNumber: z
    .string()
    .trim()
    .max(10, "מספר הבית ארוך מדי")
    .optional()
    .or(z.literal("")),
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
    .max(200, "ההערה ארוכה מדי (עד 200 תווים)")
    .optional()
    .or(z.literal("")),

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

type CheckoutShape = {
  format?: string;
  phone?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
};

/**
 * אכיפת שדות משלוח כאשר הפורמט הנבחר דורש משלוח (מודפס/חבילה).
 * משמש הן את הסכימה המלאה (צד שרת) והן את סכימת הטופס (צד לקוח), כדי
 * שהלוגיקה תישמר במקום אחד בלבד.
 */
export function requireShippingWhenNeeded(
  data: CheckoutShape,
  ctx: z.RefinementCtx
) {
  const format = (data.format ??
    siteConfig.products.defaultFormat) as keyof typeof siteConfig.products.formats;
  const definition = siteConfig.products.formats[format];
  if (!definition?.requiresShipping) return;

  const required: Array<[keyof CheckoutShape, string]> = [
    ["phone", "יש להזין מספר טלפון ליצירת קשר לגבי המשלוח"],
    ["city", "יש להזין יישוב"],
    ["street", "יש להזין רחוב"],
    ["houseNumber", "יש להזין מספר בית"],
  ];
  for (const [field, message] of required) {
    if (!data[field]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [field] });
    }
  }
  if (data.phone && !isValidIsraeliPhone(data.phone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "מספר הטלפון אינו תקין",
      path: ["phone"],
    });
  }
}

/** הסכימה המלאה - צד שרת (route handler). */
export const checkoutSchema = checkoutObject.superRefine(requireShippingWhenNeeded);

/** סכימת הטופס - ללא quantity ו-idempotencyKey (מתווספים מחוץ לטופס). */
export const checkoutFormSchema = checkoutObject
  .omit({ idempotencyKey: true, quantity: true })
  .superRefine(requireShippingWhenNeeded);

export type CheckoutInput = z.infer<typeof checkoutSchema>;
