import "server-only";

import { StorageError } from "@/lib/storage/errors";

/**
 * תצורת האחסון של הספר. נקראת אך ורק בצד השרת מחמשת משתני הסביבה הייעודיים:
 *
 *   SUPABASE_URL              - כתובת פרויקט Supabase (שרת בלבד).
 *   SUPABASE_SECRET_KEY       - מפתח סודי שרתי. לעולם לא NEXT_PUBLIC_.
 *   BOOK_STORAGE_BUCKET       - שם ה-bucket הפרטי (למשל books-private).
 *   BOOK_PDF_PATH             - נתיב האובייקט בתוך ה-bucket.
 *   BOOK_DOWNLOAD_TTL_SECONDS - תוקף הקישור החתום בשניות (60–900, ברירת מחדל 900).
 *
 * אף אחד מהערכים אינו נחשף ללקוח, אינו מודפס ללוג ואינו נשמר בבסיס הנתונים.
 */

export type StorageConfig = {
  supabaseUrl: string;
  supabaseSecretKey: string;
  bucket: string;
  objectPath: string;
  ttlSeconds: number;
};

/** גבולות תוקף הקישור החתום. הקישור לעולם לא יונפק מעבר לתקרה. */
export const MIN_TTL_SECONDS = 60;
export const MAX_TTL_SECONDS = 900;
export const DEFAULT_TTL_SECONDS = 900;

/**
 * ממיר את ערך ה-TTL שהתקבל ממשתנה הסביבה למספר תקין ובטוח:
 * - חסר / ריק  → ברירת מחדל בטוחה (900).
 * - לא מספר שלם → נכשל סגור (invalid_ttl).
 * - מתחת ל-60 או מעל 900 → נכשל סגור (invalid_ttl). הקישור לעולם לא יעלה על 900.
 */
export function resolveDownloadTtlSeconds(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_TTL_SECONDS;
  }

  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed)) {
    throw new StorageError("invalid_ttl");
  }
  if (parsed < MIN_TTL_SECONDS || parsed > MAX_TTL_SECONDS) {
    throw new StorageError("invalid_ttl");
  }
  return parsed;
}

function cleaned(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * בדיקה שקטה (ללא זריקת שגיאה) שכל משתני התצורה החיוניים קיימים. משמשת את
 * פונקציית האימות כדי לדווח מוכנוּת מבלי לחשוף פרטים.
 */
export function isStorageConfigured(): boolean {
  return Boolean(
    cleaned(process.env.SUPABASE_URL) &&
      cleaned(process.env.SUPABASE_SECRET_KEY) &&
      cleaned(process.env.BOOK_STORAGE_BUCKET) &&
      cleaned(process.env.BOOK_PDF_PATH)
  );
}

/**
 * מחזיר תצורה מאומתת או נכשל סגור עם StorageError בטוח.
 *
 * חשוב: אם חסר משתנה - זורקים StorageError("configuration_missing") גנרי.
 * לעולם לא כוללים את שמות/ערכי המשתנים החסרים בהודעת השגיאה הגלויה.
 */
export function getStorageConfig(): StorageConfig {
  const supabaseUrl = cleaned(process.env.SUPABASE_URL);
  const supabaseSecretKey = cleaned(process.env.SUPABASE_SECRET_KEY);
  const bucket = cleaned(process.env.BOOK_STORAGE_BUCKET);
  const objectPath = cleaned(process.env.BOOK_PDF_PATH);

  if (!supabaseUrl || !supabaseSecretKey || !bucket || !objectPath) {
    throw new StorageError("configuration_missing");
  }

  const ttlSeconds = resolveDownloadTtlSeconds(process.env.BOOK_DOWNLOAD_TTL_SECONDS);

  return { supabaseUrl, supabaseSecretKey, bucket, objectPath, ttlSeconds };
}
