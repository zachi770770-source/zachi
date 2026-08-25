import "server-only";

import type { SqlClient } from "@/lib/compass/types";
import { searchCompass } from "@/lib/compass/search";
import type { CompassAnswer, CompassProvider, CompassCompletion } from "@/lib/compass/assistant/types";
import { getCompassProvider } from "@/lib/compass/assistant/provider";
import { COMPASS_INSUFFICIENT_ANSWER, requiredBookVersion } from "@/lib/compass/assistant/config";
import {
  COMPASS_SYSTEM_PROMPT,
  COMPASS_CONVERSATION_SYSTEM_PROMPT,
  COMPASS_PROTECTION_REFUSAL,
  isBlockedRequest,
  buildUserContent,
  buildConversationContent,
  buildCitation,
  enforceAnswerLimits,
  isModelRefusal,
  parseNoBasisMarker,
  extractFocus,
  extractFollowup,
  type ConversationTurn,
} from "@/lib/compass/assistant/prompt";
import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";
import { assessCompassSafety, buildSafetyAnswer } from "@/lib/compass/assistant/safety";

/** תקרת טוקנים לפלט — מספיקה ל-150 מילים + נוסח הסירוב, בלי בזבוז. */
const MAX_OUTPUT_TOKENS = 512;

export interface AskResult {
  answer: CompassAnswer;
  /** צריכת טוקנים בפועל (לחישוב עלות/תיעוד; לא נחשף למשתמש). */
  usage?: CompassCompletion["usage"];
}

/** אפשרויות מצב-שיחה (עמוד הבית). כשמסופק — הזרימה שיחתית עם שאלת-המשך. */
export interface AskConversationOptions {
  /** התורות הקודמים (נשמרים בלקוח בלבד; משמשים כהקשר, לא כמקור ידע). */
  priorTurns?: ConversationTurn[];
  /** האם זהו התור האחרון (אז אין שאלת המשך, אלא סגירה קצרה). */
  isFinalTurn: boolean;
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
  provider: CompassProvider | null = getCompassProvider(),
  opts: { conversation?: AskConversationOptions } = {}
): Promise<AskResult> {
  const q = (question ?? "").trim();
  const conversation = opts.conversation;

  // שער-בטיחות דטרמיניסטי — ראשון, לפני הכול (הגנה בעומק; גם ה-route בודק לפני
  // מכסה). גובר על חסימת-הגנת-הספר: גילוי-סכנה + בקשת-חילוץ באותה הודעה מקבל
  // תמיד את מסר הבטיחות. אינו מגיע לחיפוש/מודל/ציטוט/שורת-פוקוס/שאלת-המשך.
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

  // עיגון האחזור: במצב-שיחה מצרפים את ההודעה הראשונה של המבקר (המצב שתיאר)
  // להודעה הנוכחית, כדי שתשובת המשך קצרה („כן, גם ביטלה”) עדיין תיקשר לקטעים
  // הנכונים. הגריעה נשארת מונחית-שאילתה בלבד; אין מעבר סדרתי על הספר.
  const firstUser = conversation?.priorTurns?.find((t) => t.role === "user")?.text;
  const searchText = conversation && firstUser ? `${firstUser} ${q}` : q;

  const search = await searchCompass(db, searchText);
  // חייבת להיות גרסה פעילה, והיא חייבת להיות *בדיוק* הגרסה הנדרשת (888).
  if (search.bookVersion === null || search.bookVersion !== requiredBookVersion()) {
    return { answer: { status: "unavailable", reason: "no-active-book" } };
  }
  if (!search.matched || search.results.length === 0) {
    return { answer: { status: "refused", text: COMPASS_INSUFFICIENT_ANSWER } };
  }

  const completion = await provider.generate({
    system: conversation ? COMPASS_CONVERSATION_SYSTEM_PROMPT : COMPASS_SYSTEM_PROMPT,
    userContent: conversation
      ? buildConversationContent({
          question: q,
          matches: search.results,
          priorTurns: conversation.priorTurns,
          isFinalTurn: conversation.isFinalTurn,
        })
      : buildUserContent(q, search.results),
    maxTokens: MAX_OUTPUT_TOKENS,
  });

  // סירוב אמיתי מפורש: המודל סימן שאין בקטעים חומר קרוב כלל. מקבל את משפט-הסירוב
  // האנושי והספציפי שלו (או את הנוסח הקבוע), בלי ציטוט/פוקוס/שאלת-המשך. נבדק לפני
  // חילוץ/מסגור כדי שמענה מעוגן-על-עיקרון-סמוך („הספר לא קובע… אבל…”) לא ייבלע.
  const noBasis = parseNoBasisMarker(completion.text);
  if (noBasis) {
    return { answer: { status: "refused", text: noBasis.text }, usage: completion.usage };
  }

  // מחלצים תחילה את השורה הנגררת (שאלת-המשך במצב-שיחה, „על מה שווה לשים לב”
  // בשאלה בודדת) מהפלט הגולמי, כדי שתקרת-המילים של הגוף לא תבלע אותה.
  const extracted = conversation
    ? extractFollowup(completion.text)
    : extractFocus(completion.text);
  const body = extracted.body;
  const followup =
    conversation && !conversation.isFinalTurn
      ? (extracted as { followup?: string }).followup
      : undefined;
  const focus = conversation ? undefined : (extracted as { focus?: string }).focus;

  const maxWords = conversation
    ? COMPASS_LIMITS.maxConversationAnswerWords
    : COMPASS_LIMITS.maxAnswerWords;
  const answerText = enforceAnswerLimits(body, maxWords);
  // סירוב לעולם אינו יוצא כ„תשובה”: אין ציטוט, אין שורה נגררת, ואין המשך
  // „רגיל” בממשק. נבדק גם על הפלט הגולמי, למקרה שפיצול השורה הנגררת הותיר גוף
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
      ...(followup ? { followup } : {}),
    },
    usage: completion.usage,
  };
}
