import { z } from "zod";

import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";

/**
 * ולידציה של שאלת „המצפן”. עד 400 תווים. השדה honeypot נסתר — אמור להישאר
 * ריק. אין שדות מזהים אישית.
 */
export const compassQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "השאלה קצרה מדי")
    .max(COMPASS_LIMITS.maxQuestionChars, "השאלה ארוכה מדי"),
  company: z.string().max(200).optional(), // honeypot
});

export type CompassQuestionInput = z.infer<typeof compassQuestionSchema>;
