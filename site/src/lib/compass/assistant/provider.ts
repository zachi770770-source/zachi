import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type {
  CompassCompletion,
  CompassProvider,
  CompassProviderInput,
} from "@/lib/compass/assistant/types";
import {
  compassModel,
  hasProviderKey,
  COMPASS_PROVIDER_TIMEOUT_MS,
} from "@/lib/compass/assistant/config";

/**
 * שכבת ספק המודל. מופשטת מאחורי CompassProvider כדי שאפשר יהיה להחליף מודל
 * או ספק בעתיד בלי לגעת בשאר הקוד. כרגע קיים מימוש אחד (Anthropic), במודל
 * חסכוני ובטמפרטורה נמוכה. המפתח נקרא מהסביבה בצד השרת בלבד ולעולם לא מודפס.
 */

/** טמפרטורה נמוכה: תשובות עקביות וצמודות למקור, פחות „יצירתיות”. */
const TEMPERATURE = 0;

class AnthropicCompassProvider implements CompassProvider {
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string) {
    this.model = model;
    // maxRetries נמוך + timeout (מ״ש): שגיאה/timeout מוחזרים מהר; הראוט
    // מגלגל אחורה את המכסה שנצרכה כך ש-timeout לא „עולה” שאלה.
    this.client = new Anthropic({ apiKey, maxRetries: 1, timeout: COMPASS_PROVIDER_TIMEOUT_MS });
  }

  async generate(input: CompassProviderInput): Promise<CompassCompletion> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: input.maxTokens,
      temperature: TEMPERATURE,
      system: input.system,
      messages: [{ role: "user", content: input.userContent }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return {
      text,
      model: res.model ?? this.model,
      usage: {
        inputTokens: res.usage?.input_tokens ?? 0,
        outputTokens: res.usage?.output_tokens ?? 0,
      },
    };
  }
}

const globalForProvider = globalThis as unknown as {
  compassProvider?: CompassProvider | null;
};

/**
 * מחזיר את ספק המודל, או null כאשר אין מפתח API — במקרה כזה העוזר אינו
 * פעיל והראוט מחזיר מצב „לא זמין” (לעולם לא תוכן פיקצ׳ר).
 */
export function getCompassProvider(): CompassProvider | null {
  if (globalForProvider.compassProvider !== undefined) {
    return globalForProvider.compassProvider;
  }
  if (!hasProviderKey()) {
    globalForProvider.compassProvider = null;
    return null;
  }
  globalForProvider.compassProvider = new AnthropicCompassProvider(
    process.env.ANTHROPIC_API_KEY as string,
    compassModel()
  );
  return globalForProvider.compassProvider;
}

/** לבדיקות בלבד: הזרקת ספק מדומה ואיפוס. */
export function __setCompassProviderForTest(p: CompassProvider | null | undefined): void {
  globalForProvider.compassProvider = p;
}
