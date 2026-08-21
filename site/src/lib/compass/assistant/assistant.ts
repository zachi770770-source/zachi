import "server-only";

import type { SqlClient } from "@/lib/compass/types";
import { searchCompass } from "@/lib/compass/search";
import type { CompassAnswer, CompassProvider, CompassCompletion } from "@/lib/compass/assistant/types";
import { getCompassProvider } from "@/lib/compass/assistant/provider";
import { COMPASS_INSUFFICIENT_ANSWER, requiredBookVersion } from "@/lib/compass/assistant/config";
import {
  COMPASS_SYSTEM_PROMPT,
  COMPASS_PROTECTION_REFUSAL,
  isBlockedRequest,
  buildUserContent,
  buildCitation,
  enforceAnswerLimits,
  isModelRefusal,
  extractFocus,
} from "@/lib/compass/assistant/prompt";
import { assessCompassSafety, buildSafetyAnswer } from "@/lib/compass/assistant/safety";

/** תקרת טוקנים לפלט — מספיקה ל-150 מילים + נוסח הסירוב, בלי בזבוז. */
const MAX_OUTPUT_TOKENS = 512;

export interface AskResult {
  answer: CompassAnswer;
  /** צריכת טוקנים בפועל (לחישוב עלות/תיעוד; לא נחשף למשתמש). */
  usage?: CompassCompletion["usage"];
}

/**
 * זרימת העוזר, בצד השרת בלבד:
 * 0. שער-בטיחות דטרמיניסטי (ללא מודל/רשת) — עוצר סכנה/פגיעה/משבר לפני הכול.
 * 1. חסימת ניסיונות הגנת-ספר/הזרקה (סירוב עדין).
 * 2. אם אין ספק מודל → „לא זמין” (never fixture).
 * 3. חיפוש בשכבת הידע: אין גרסה פעילה → „לא זמין”; אין התאמה → סירוב.
 * 4. הפקת תשובה מהמודל, אכיפת מגבלות, ותוספת ייחוס דטרמיניסטי.
 */
export async function askCompass(
  db: SqlClient,
  question: string,
  provider: CompassProvider | null = getCompassProvider()
): Promise<AskResult> {
  const q = (question ?? "").trim();

  // שער-בטיחות דטרמיניסטי — ראשון, לפני הכול (הגנה בעומק; גם ה-route בודק לפני
  // מכסה). גובר על חסימת-הגנת-הספר: גילוי-סכנה + בקשת-חילוץ באותה הודעה מקבל
  // תמיד את מסר הבטיחות. אינו מגיע לחיפוש/מודל/ציטוט/שורת-פוקוס.
  const safety = assessCompassSafety(q);
  if (!safety.safe) {
    return { answer: buildSafetyAnswer(safety) };
  }

  if (isBlockedRequest(q)) {
    return { answer: { status: "refused", text: COMPASS_PROTECTION_REFUSAL } };
  }

  if (!provider) {
    return { answer: { status: "unavailable", reason: "no-provider" } };
  }

  const search = await searchCompass(db, q);
  // חייבת להיות גרסה פעילה, והיא חייבת להיות *בדיוק* הגרסה הנדרשת (888).
  if (search.bookVersion === null || search.bookVersion !== requiredBookVersion()) {
    return { answer: { status: "unavailable", reason: "no-active-book" } };
  }
  if (!search.matched || search.results.length === 0) {
    return { answer: { status: "refused", text: COMPASS_INSUFFICIENT_ANSWER } };
  }

  const completion = await provider.generate({
    system: COMPASS_SYSTEM_PROMPT,
    userContent: buildUserContent(q, search.results),
    maxTokens: MAX_OUTPUT_TOKENS,
  });

  // מחלצים תחילה את שורת „על מה שווה לשים לב עכשיו” (אם קיימת) מהפלט הגולמי,
  // כדי שתקרת-המילים של הגוף לא תבלע אותה. השורה מבוססת על אותם קטעים בלבד.
  const { body, focus } = extractFocus(completion.text);
  const answerText = enforceAnswerLimits(body);
  // סירוב לעולם אינו יוצא כ„תשובה”: אין ציטוט, אין שורת-פוקוס, ואין המשך
  // „רגיל” בממשק. נבדק גם על הפלט הגולמי, למקרה שפיצול שורת-הפוקוס הותיר גוף
  // שאינו נראה כסירוב בעוד שהתשובה כולה כן.
  if (!answerText || isModelRefusal(answerText) || isModelRefusal(completion.text)) {
    return {
      answer: { status: "refused", text: COMPASS_INSUFFICIENT_ANSWER },
      usage: completion.usage,
    };
  }

  return {
    answer: {
      status: "answered",
      text: answerText,
      citation: buildCitation(search.results),
      ...(focus ? { focus } : {}),
    },
    usage: completion.usage,
  };
}
