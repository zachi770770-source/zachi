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

/** קטגוריות שער-הבטיחות הדטרמיניסטי (server-side). */
export type CompassSafetyCategory =
  | "violence"
  | "coercive_control"
  | "stalking"
  | "self_harm"
  | "immediate_danger"
  | "medical"
  | "crisis";

/** דרגת דחיפות: „critical” = סכנה מיידית; „high” = חמור אך לא בהכרח מיידי. */
export type CompassSafetySeverity = "high" | "critical";

/** התוצאה הסופית שהעוזר מחזיר לראוט. */
export type CompassAnswer =
  | {
      status: "answered";
      /** תשובה בעברית, קצרה ומעשית, מבוססת רק על הקטעים. */
      text: string;
      /** „מבוסס על: פרק X — שם הפרק” (עד שני מקורות). */
      citation: string;
      /**
       * שורת „על מה שווה לשים לב עכשיו” — משפט עריכתי קצר אחד, *אופציונלי*,
       * שהמודל מפיק מתוך אותם קטעים בלבד (לא ידע כללי). נחלץ דטרמיניסטית
       * מהפלט; אם אינו קיים או אינו מבוסס, השדה נשאר undefined ושום דבר אינו
       * מוצג. לעולם אינו מופיע בסירוב/חסימה/שגיאה/מצב בדיקות, ומושמט במצבי
       * בטיחות (המודל מונחה לא לצרף אותו כשמדובר בסכנה/פגיעה/משבר).
       */
      focus?: string;
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
    }
  | {
      /**
       * שער-בטיחות דטרמיניסטי נורה: הקלט הכיל גילוי של סכנה/פגיעה/משבר. הבקשה
       * *לעולם* אינה מגיעה לחיפוש/מודל/ציטוט/שורת-פוקוס. התשובה היא מסר בטיחות
       * מרוסן בלבד.
       */
      status: "safety";
      category: CompassSafetyCategory;
      severity: CompassSafetySeverity;
      /** מסר הבטיחות המרוסן (בלי אבחון, בלי עצה זוגית, בלי ציטוט, בלי פוקוס). */
      text: string;
    };
