import { z } from "zod";

import { PERSONA_IDS, PERSONA_SOURCE_VALUES } from "@/content/personas";

/** גרסת ההסכמה — לתיעוד consent לפי דרישות פרטיות. */
export const WAITLIST_CONSENT_VERSION = "2026-07-v1";

export const WAITLIST_SOURCES = [
  "hero",
  "sample",
  "checkout_closed",
  "homepage",
  "waitlist",
  "preview",
  "compass",
] as const;

export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

/**
 * סכימת רשימת ההמתנה. אימייל תקין בלבד; הסכמה חובה; מקור מוגבל לערכים
 * ידועים. `company` הוא honeypot נסתר — אמור להישאר ריק.
 */
export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("יש להזין כתובת אימייל תקינה")
    .max(254, "כתובת האימייל ארוכה מדי"),
  consent: z
    .boolean()
    .refine((v) => v === true, "יש לאשר את קבלת העדכון כדי להירשם"),
  source: z.enum(WAITLIST_SOURCES).default("homepage"),
  /**
   * הפרסונה שנבחרה (אם בכלל) ומאיפה נבחרה — לשיוך שיווקי בלבד. אופציונליים,
   * מקבלים גם null (גולש שלא בחר פרסונה). אינם נתונים אישיים.
   */
  persona: z.enum(PERSONA_IDS).nullish(),
  personaSource: z.enum(PERSONA_SOURCE_VALUES).nullish(),
  /** honeypot — לא נשמר; אם מולא, מדובר כנראה בבוט. */
  company: z.string().max(120).optional().or(z.literal("")),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
