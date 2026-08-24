import { z } from "zod";

import { COMPASS_LIMITS, COMPASS_MAX_USER_TURNS } from "@/lib/compass/assistant/config";

/**
 * ולידציה של פניית „המצפן”. עד 400 תווים בשאלה. השדה honeypot נסתר — אמור
 * להישאר ריק. אין שדות מזהים אישית ואין אחסון של תוכן.
 *
 * מצב-שיחה (עמוד הבית): הלקוח שולח `mode:"conversation"`, את התחנה שנבחרה
 * (`station`), ואת ההקשר הקצר מהתורות הקודמות (`context`) — הכול נשמר בצד
 * הלקוח (session/tab) ונשלח כדי להפיק את התשובה הבאה בלבד. השרת נשאר חסר-מצב:
 * ההקשר אינו נשמר. אורך ההקשר חסום כדי שהשיחה תישאר קצרה (עד maxUserTurns).
 */

/** תור בודד בהקשר השיחה שנשלח מהלקוח (מוגבל באורך; אינו נשמר בשרת). */
export const compassTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(800),
});

export const compassQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "השאלה קצרה מדי")
    .max(COMPASS_LIMITS.maxQuestionChars, "השאלה ארוכה מדי"),
  company: z.string().max(200).optional(), // honeypot
  /** ברירת מחדל: שאלה בודדת (‎/compass). "conversation" = החוויה השיחתית בבית. */
  mode: z.enum(["single", "conversation"]).optional(),
  /** התחנה שנבחרה בבית — למיסגור ולעיגון האחזור. */
  station: z.enum(["dating", "building", "existing", "after-breakup"]).optional(),
  /**
   * הקשר קצר מהתורות הקודמות (נשמר בלקוח בלבד). חסום ל-`2*(maxUserTurns-1)`
   * פריטים — מספיק לשיחה בת maxUserTurns תורות ולא יותר.
   */
  context: z
    .array(compassTurnSchema)
    .max(2 * (COMPASS_MAX_USER_TURNS - 1))
    .optional(),
});

export type CompassTurnInput = z.infer<typeof compassTurnSchema>;
export type CompassQuestionInput = z.infer<typeof compassQuestionSchema>;
