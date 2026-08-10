/**
 * טיפוסים משותפים לעוזר „המצפן של מדייטים לאהבה”.
 *
 * הכול רץ בצד השרת בלבד. המטרה: טעימה מגישת הספר, לא תחליף לקריאתו.
 */

/** קלט אחיד וגנרי לספק המודל — מופשט כדי לאפשר החלפת מודל/ספק בעתיד. */
export interface CompassProviderInput {
  /** הנחיית המערכת (כללי מקור סגור, סירוב, הגנת ספר). */
  system: string;
  /** תוכן פנייה בנוי מראש: השאלה + הקטעים הממוספרים. */
  userContent: string;
  /** תקרת טוקנים לפלט. */
  maxTokens: number;
}

/** פלט אחיד מהספק. */
export interface CompassCompletion {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  /** מזהה המודל ששימש בפועל (לתיעוד/עלות, לא נחשף למשתמש). */
  model: string;
}

/**
 * ממשק ספק המודל. שכבת הפשטה: כדי להחליף מודל או ספק בעתיד מספיק להוסיף
 * מימוש נוסף — שאר המערכת אינה תלויה ב-SDK מסוים.
 */
export interface CompassProvider {
  readonly model: string;
  generate(input: CompassProviderInput): Promise<CompassCompletion>;
}

/** התוצאה הסופית שהעוזר מחזיר לראוט. */
export type CompassAnswer =
  | {
      status: "answered";
      /** תשובה בעברית, קצרה ומעשית, מבוססת רק על הקטעים. */
      text: string;
      /** „מבוסס על: פרק X — שם הפרק” (עד שני מקורות). */
      citation: string;
    }
  | {
      status: "refused";
      /** נוסח הסירוב המאושר (אין בסיס מספיק / חסימת הגנת ספר). */
      text: string;
    }
  | {
      /** העוזר אינו פעיל: אין ספק מודל, או אין גרסת ספר פעילה. */
      status: "unavailable";
      reason: "no-provider" | "no-active-book";
    };
