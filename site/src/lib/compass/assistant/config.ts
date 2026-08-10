import "server-only";

/**
 * הגדרות ומגבלות העוזר — מקור אמת יחיד, בצד השרת בלבד.
 *
 * העוזר אינו „פעיל” עד שמתקיימים כל התנאים: דגל הפעלה מפורש, מפתח API של
 * הספק, וגרסת ספר אמיתית שיובאה והופעלה (נבדק בזמן ריצה מול מסד הנתונים).
 * כל עוד אינם מתקיימים — הראוט מחזיר מצב „לא זמין” ולעולם לא תוכן פיקצ׳ר
 * או קופי שיווקי. זהו יישום העיקרון: אין להתחיל את העוזר עם fixture.
 */

/** מגבלות שימוש — נאכפות בצד השרת בלבד. */
export const COMPASS_LIMITS = {
  /** עד 3 שאלות ב-24 שעות. */
  perDay: 3,
  /** עד 7 שאלות מצטברות (לכל החיים של המזהה האנונימי). */
  lifetime: 7,
  /** עד 400 תווים בשאלה. */
  maxQuestionChars: 400,
  /** עד 150 מילים בתשובה. */
  maxAnswerWords: 150,
  /** עד 25 מילים בציטוט ישיר יחיד מתוך הספר. */
  maxQuoteWords: 25,
  /** חלון היממה במילישניות. */
  windowMs: 24 * 60 * 60 * 1000,
} as const;

/**
 * ברירת מחדל: מזהה מודל מקובע (dated) של Haiku 4.5, חסכוני ותומך בטמפרטורה
 * נמוכה. ניתן לעקוף דרך COMPASS_MODEL. פינון המזהה מונע שינוי התנהגות שקט.
 */
export const DEFAULT_COMPASS_MODEL = "claude-haiku-4-5-20251001";

/**
 * גרסת הספר הנדרשת. ה-API יישאר „לא זמין” אלא אם הגרסה הפעילה תואמת *בדיוק*
 * לערך הזה — לא מספיק שקיימת גרסה פעילה כלשהי. ברירת מחדל לגרסת 888 האמיתית;
 * ניתן לעקוף דרך COMPASS_REQUIRED_BOOK_VERSION.
 */
export const DEFAULT_REQUIRED_BOOK_VERSION = "medaytim-laahava-888-final";

/** תקרת זמן לקריאה לספק המודל (מ״ש) — timeout מגלגל אחורה מכסה שנצרכה. */
export const COMPASS_PROVIDER_TIMEOUT_MS = 20_000;

/*
 * עלות (הערכה, claude-haiku-4-5): כ-2,700 טוקני קלט + ~320 פלט לשאלה →
 * ~$0.004 לשאלה, ~$4.3 ל-1,000 שאלות, ומקסימום ~$0.03 למשתמש (תקרת 7).
 *
 * חשוב: אין להבטיח חיסכון מ-Prompt Caching. סף המטמון של Haiku 4.5 הוא
 * ~4,096 טוקנים, והקלט המשוער (כולל הנחיית מערכת + עד 5 קטעים) נמוך מכך,
 * כך שהפרפיקס עלול כלל לא להיכנס למטמון. לפני טענה לחיסכון יש למדוד בפועל
 * את שדות השימוש (cache_read_input_tokens) על תעבורה אמיתית.
 */

/**
 * נוסח הסירוב המאושר כאשר אין בסיס מספיק בספר. חייב להיות מדויק.
 */
export const COMPASS_INSUFFICIENT_ANSWER =
  "לא מצאתי בספר בסיס מספיק לתשובה מדויקת על השאלה הזאת. אפשר לנסות לנסח אותה אחרת או לשאול על דייטינג, התאמה, גבולות, משיכה או בניית קשר.";

/**
 * האם התכונה מופעלת בכלל (דגל תפעולי). לא בודק גרסת ספר פעילה — זה נעשה
 * בזמן ריצה מול מסד הנתונים. ברירת מחדל: כבוי.
 */
export function isCompassFeatureEnabled(): boolean {
  return process.env.COMPASS_ASSISTANT_ENABLED === "true";
}

/** מפתח ה-API של הספק קיים? (נקרא בצד שרת בלבד; לעולם לא מודפס). */
export function hasProviderKey(): boolean {
  return typeof process.env.ANTHROPIC_API_KEY === "string" && process.env.ANTHROPIC_API_KEY.length > 0;
}

/** מזהה המודל שייעשה בו שימוש. */
export function compassModel(): string {
  return process.env.COMPASS_MODEL || DEFAULT_COMPASS_MODEL;
}

/** גרסת הספר הנדרשת (הגרסה הפעילה חייבת להיות זהה לה בדיוק). */
export function requiredBookVersion(): string {
  return process.env.COMPASS_REQUIRED_BOOK_VERSION || DEFAULT_REQUIRED_BOOK_VERSION;
}
