/**
 * שלב-המסע של המבקר — ההקשר שקובע *מה הפעולה הבאה הנכונה*.
 *
 * הכוונה המחקרית הייתה התקדמות: קודם מזמינים לקרוא, ורק אחרי שקראו באמת
 * מזמינים להמשיך אל הספר. בגרסה הקודמת המנגנון נכתב אך מעולם לא נקרא —
 * `mdl_sample_seen` נשמר ואיש לא השתמש בו — ולכן הבר הציע „קראו טעימה” גם
 * למי שכבר סיים לקרוא אותה. ההתקדמות מוחזרת כאן, מותאמת למציאות הנוכחית:
 * הספר יצא, ולכן שלב-ההמשך הוא הספר עצמו (אמזון) ולא רשימת-המתנה.
 *
 * אחסון מקומי בלבד, ללא PII, ולא נשלח לשום מקום.
 */

const SEEN_KEY = "mdl_sample_seen";

export type JourneyStage = "browsing" | "sampled";

/** קריאה בטוחה. בסביבת שרת / ללא localStorage — תמיד „browsing”. */
export function readJourneyStage(): JourneyStage {
  if (typeof window === "undefined") return "browsing";
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1" ? "sampled" : "browsing";
  } catch {
    return "browsing";
  }
}

/** מסמן שהטעימה *נקראה באמת* (ולא רק שהעמוד נטען). */
export function markSampled(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* לא קריטי */
  }
}

/**
 * מטמון-תמונת-מצב ל-`useSyncExternalStore`: React קורא את ה-getSnapshot
 * הרבה פעמים, והוא חייב להחזיר ערך *יציב* בין קריאות באותו רינדור. קריאה
 * ישירה ל-localStorage בכל קריאה עובדת אך מיותרת, ולכן היא נקראת פעם אחת.
 */
let cached: JourneyStage | null = null;

export function subscribeJourneyStage(): () => void {
  // השלב נקבע פעם אחת לכל טעינת-עמוד ואינו משתנה תחת המשתמש — אין למה
  // להירשם. פונקציית-ביטול ריקה היא החוזה הנכון כאן.
  return () => {};
}

export function getJourneyStageSnapshot(): JourneyStage {
  if (cached === null) cached = readJourneyStage();
  return cached;
}

/** תמונת-המצב בשרת — תמיד „browsing”, ולכן ההידרציה תמיד תואמת. */
export function getJourneyStageServerSnapshot(): JourneyStage {
  return "browsing";
}
