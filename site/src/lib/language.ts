"use client";

/**
 * העדפת-שפה מפורשת של המשתמש.
 *
 * המנגנון הקטן ביותר שמספיק כאן הוא `localStorage`, ולא cookie: אין ניתוב
 * בצד השרת (ראו ההחלטה ב-`LanguageHint`), ולכן השרת לא צריך לדעת דבר.
 * ערך שנשמר ב-localStorage גם אינו נשלח בכל בקשה, אינו מזהה אף אחד, ואינו
 * נוגע במנגנון הסכמת-העוגיות — זו העדפת-ממשק, לא מדידה ולא מעקב.
 */

const STORAGE_KEY = "zachi_lang";

export type SupportedLanguage = "he" | "en";

/**
 * האם הנתיב הנוכחי שייך למהדורה האנגלית.
 *
 * ההדר יושב ב-root layout ולכן מרונדר גם מעל „/” וגם מעל „/en”. אין סגמנט
 * שפה במסלול (ראו ההחלטה ב-`/en/page.tsx`), ולכן הנתיב הוא מקור-האמת היחיד
 * לשאלה באיזו שפה ההדר צריך לדבר. נגזר מהנתיב *בלבד* — לא מההעדפה השמורה
 * ולא משפת הדפדפן: ההדר חייב להתאים לתוכן שמתחתיו, ומבקר שהגיע ל„/” בקישור
 * ישיר אמור לראות הדר עברי גם אם בחר אנגלית בעבר.
 */
export function isEnglishPath(pathname: string | null | undefined): boolean {
  return pathname === "/en" || (pathname?.startsWith("/en/") ?? false);
}

/** ההעדפה המפורשת שנשמרה, או null כשהמשתמש עוד לא בחר. */
export function getStoredLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "he" || raw === "en" ? raw : null;
  } catch {
    // אחסון חסום (מצב פרטי/הגדרות דפדפן) — מתנהגים כמו „אין העדפה”.
    return null;
  }
}

/** שומר בחירה מפורשת. נקרא רק מתוך פעולת-משתמש ישירה. */
export function storeLanguage(lang: SupportedLanguage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* אחסון חסום — הבחירה עדיין תקפה לניווט הנוכחי, פשוט לא נזכרת */
  }
}

/**
 * האם *העדפת הדפדפן* היא אנגלית על פני עברית.
 *
 * `navigator.languages` מסודר לפי סדר העדפה, ולכן מספיק למצוא מי מהשתיים
 * מופיעה קודם. שפה שאינה נתמכת אינה מכריעה כלום: אם המשתמש מעדיף צרפתית
 * ואחריה עברית — עברית מנצחת. אם אין אף אחת מהשתיים ברשימה, מחזירים false
 * ונשארים בעברית, שהיא ברירת המחדל המתועדת של האתר.
 *
 * זו *רק* רמיזה ל-UI. היא לעולם אינה מנתבת, אינה חוסמת ואינה משנה תוכן.
 */
export function prefersEnglishOverHebrew(): boolean {
  if (typeof navigator === "undefined") return false;
  const list = navigator.languages?.length
    ? navigator.languages
    : [navigator.language].filter(Boolean);
  for (const tag of list) {
    const base = String(tag).toLowerCase().split("-")[0];
    if (base === "en") return true;
    if (base === "he" || base === "iw") return false; // „iw” — קוד עברית ישן
  }
  return false;
}
