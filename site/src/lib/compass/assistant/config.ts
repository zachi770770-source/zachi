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

/** ברירת מחדל: מודל חסכוני שתומך בטמפרטורה נמוכה. ניתן לעקוף דרך COMPASS_MODEL. */
export const DEFAULT_COMPASS_MODEL = "claude-haiku-4-5";

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
