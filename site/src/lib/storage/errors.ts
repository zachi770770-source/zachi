/**
 * שגיאות מטופסות ובטוחות עבור שכבת האחסון של הספר.
 *
 * עיקרון: אף פעם לא לחשוף פרטים פנימיים (URL, מפתחות, שם bucket, נתיב אובייקט,
 * הודעת שגיאה מקורית או stack) דרך אובייקט השגיאה. ההודעה הגלויה היא תמיד
 * טקסט גנרי אחיד; ההבחנה הפנימית נעשית אך ורק דרך שדה `code`.
 */

export type StorageErrorCode =
  | "configuration_missing"
  | "invalid_ttl"
  | "order_not_paid"
  | "signing_failed";

/** הודעה גנרית ובטוחה - זהה לכל הקודים, כדי שלעולם לא יזלוג מידע פנימי. */
const SAFE_MESSAGE = "Book download is not available.";

/**
 * שגיאת אחסון מטופסת. ההודעה תמיד גנרית; יש להבדיל לפי `code` בלבד.
 * לעולם אין להעביר לקונסטרקטור מחרוזת שמקורה בשגיאת ספק, ב-env או בקלט משתמש.
 */
export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode) {
    super(SAFE_MESSAGE);
    this.name = "StorageError";
    this.code = code;
    // שמירה על שרשרת הפרוטוטייפ ב-target ES2017.
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/** בדיקת עזר: האם הערך הוא StorageError עם קוד נתון (או כלשהו). */
export function isStorageError(
  err: unknown,
  code?: StorageErrorCode
): err is StorageError {
  if (!(err instanceof StorageError)) return false;
  return code === undefined ? true : err.code === code;
}
