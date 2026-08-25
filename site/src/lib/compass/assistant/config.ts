import "server-only";

/**
 * הגדרות ומגבלות העוזר — מקור אמת יחיד, בצד השרת בלבד.
 *
 * העוזר אינו „פעיל” עד שמתקיימים כל התנאים: דגל הפעלה מפורש, מפתח API של
 * הספק, וגרסת ספר אמיתית שיובאה והופעלה (נבדק בזמן ריצה מול מסד הנתונים).
 * כל עוד אינם מתקיימים — הראוט מחזיר מצב „לא זמין” ולעולם לא תוכן פיקצ׳ר
 * או קופי שיווקי. זהו יישום העיקרון: אין להתחיל את העוזר עם fixture.
 */

/**
 * מגבלות שימוש — נאכפות בצד השרת בלבד.
 *
 * המכסה נמדדת ב*תורות* (כל קריאה למודל = תור אחד). מאז שהעוזר הפך לשיחתי קצר
 * (עד `maxUserTurns` תורות לשיחה), המכסה בוטאה מחדש ביחידות-תור כדי ששיחה
 * אחת לא תבלע את כל ההקצאה: `perDay`/`lifetime` = מספר-שיחות × `maxUserTurns`.
 * המשמעות למשתמש נשמרה: ~3 שיחות ליום, ~7 שיחות לכל חיי המזהה האנונימי. הגנת
 * העלות/ניצול זהה לחלוטין: כל תור צורך יחידה אחת (ומגולגל אחורה בכשל), ומעליה
 * חל גם ה-rate-limit לפי IP.
 */
export const COMPASS_LIMITS = {
  /** תורות ב-24 שעות (≈3 שיחות × maxUserTurns). */
  perDay: 9,
  /** תורות מצטברות לכל חיי המזהה האנונימי (≈7 שיחות × maxUserTurns). */
  lifetime: 21,
  /** מספר תורות-משתמש מרבי בשיחה אחת (הזמנה → מענה → המשך). */
  maxUserTurns: 3,
  /** עד 400 תווים בשאלה. */
  maxQuestionChars: 400,
  /** עד 150 מילים בתשובה (מצב שאלה-בודדת ב-/compass). */
  maxAnswerWords: 150,
  /** תשובה שיחתית קצרה יותר — כיוון חד, לא מסה. */
  maxConversationAnswerWords: 90,
  /** עד 25 מילים בציטוט ישיר יחיד מתוך הספר. */
  maxQuoteWords: 25,
  /** חלון היממה במילישניות. */
  windowMs: 24 * 60 * 60 * 1000,
} as const;

/** מספר תורות-המשתמש המרבי בשיחה שיחתית אחת בעמוד הבית. */
export const COMPASS_MAX_USER_TURNS = COMPASS_LIMITS.maxUserTurns;

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
 * נוסח הסירוב האנושי — נאמר רק כשבאמת אין בספר חומר רלוונטי כלל (או כשהמודל
 * סימן זאת מפורשות בלי משפט ספציפי משלו). *לא* נוסח „מנוע-חיפוש שנכשל”: בלי
 * רשימת נושאים מותרים, בלי „נסו לנסח מחדש”. כשקיים חומר קרוב — המערכת מעדיפה
 * מענה מעוגן על עיקרון סמוך, ולא את הנוסח הזה (ראו prompt.ts / assistant.ts).
 */
export const COMPASS_INSUFFICIENT_ANSWER =
  "זאת לא שאלה שהספר הזה באמת נכנס אליה, ולא נכון שאמציא לכם תשובה בשמו. אם יש משהו אחר שמעסיק אתכם עכשיו, אני כאן להקשיב.";

/**
 * האם התכונה מופעלת בכלל (דגל תפעולי). לא בודק גרסת ספר פעילה — זה נעשה
 * בזמן ריצה מול מסד הנתונים. ברירת מחדל: כבוי.
 */
export function isCompassFeatureEnabled(): boolean {
  return process.env.COMPASS_ASSISTANT_ENABLED === "true";
}

/**
 * דגל *תצוגה בלבד* למצב Preview/Staging: מאפשר להציג את ממשק השאלה-החופשית
 * („שאל את הספר”) כדי לבדוק אותו ויזואלית — *בלי* להפעיל מענה אמיתי. אינו
 * נוגע ב-COMPASS_ASSISTANT_ENABLED, אינו פותח את /api/compass, ולעולם אינו
 * ממציא תשובה: הטופס נראה, אפשר להקליד, אך השליחה נעצרת בהודעה מרוסנת.
 * ברירת מחדל: כבוי. בפרודקשן נשאר כבוי (מציגים את המצפן המודרך בלבד).
 */
export function isFreeTextUiPreviewEnabled(): boolean {
  return process.env.COMPASS_FREE_TEXT_UI_PREVIEW === "true";
}

/**
 * מצב-התצוגה של עמוד /compass — הפרדה מכוונת בין „מוכנות-ממשק” ל„מוכנות-מנוע”:
 *   • "free-text-live"    — העוזר הופעל (COMPASS_ASSISTANT_ENABLED=true). הממשק
 *                           החופשי פעיל ושולח דרך /api/compass האמיתי (שעדיין
 *                           מגודר במסד/ספק/גרסה, ולכן יכול להחזיר „בקרוב”).
 *   • "free-text-preview" — רק דגל התצוגה דלוק. הממשק החופשי נראה וניתן לבדיקה,
 *                           אך אינו מפיק תשובה — לבדיקת Preview/Staging בלבד.
 *   • "guided"            — ברירת המחדל (וגם פרודקשן): המצפן המודרך בלבד. הממשק
 *                           החופשי אינו נחשף כלל.
 * העוזר-האמיתי גובר על דגל-התצוגה: אם שניהם דלוקים, המצב הוא "free-text-live".
 */
export type CompassSurface = "guided" | "free-text-live" | "free-text-preview";

export function resolveCompassSurface(): CompassSurface {
  if (isCompassFeatureEnabled()) return "free-text-live";
  if (isFreeTextUiPreviewEnabled()) return "free-text-preview";
  return "guided";
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
