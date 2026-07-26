import "server-only";

import type { Order } from "@/lib/orders";
import {
  getStorageConfig,
  isStorageConfigured,
  MIN_TTL_SECONDS,
} from "@/lib/storage/config";
import { createStorageClient } from "@/lib/storage/client";
import { StorageError } from "@/lib/storage/errors";
import {
  classifyStorageError,
  formatStorageErrorLog,
} from "@/lib/storage/diagnostics";

/**
 * שכבת אספקת הספר הדיגיטלי דרך Supabase Storage הפרטי.
 *
 * עקרונות אבטחה:
 * - ה-bucket פרטי. משתמשים אך ורק ב-createSignedUrl - לעולם לא ב-getPublicUrl.
 * - נתיב האובייקט הקבוע (BOOK_PDF_PATH) אינו נחשף ללקוח; רק קישור חתום זמני.
 * - נוצר קישור חתום טרי לכל אספקה מורשית. הקישור אינו נשמר ב-DB ואינו מוחזק במטמון.
 * - קישור חתום מונפק אך ורק כאשר הוזמן אובייקט הזמנה עם סטטוס תשלום "paid".
 */

/** שם קובץ בטוח שיוצג למשתמש בהורדה. אינו חושף את נתיב האובייקט האמיתי. */
const DOWNLOAD_FILENAME = "medaytim-laahava.pdf";

/**
 * יוצר קישור חתום טרי לקובץ הספר. פנימי בלבד - אינו בודק הרשאה עסקית.
 * מחזיר את הקישור החתום כמחרוזת ולעולם אינו מדפיס אותו ללוג.
 */
async function createSignedBookUrl(ttlOverrideSeconds?: number): Promise<string> {
  const config = getStorageConfig();
  const client = createStorageClient(config);
  const expiresIn = ttlOverrideSeconds ?? config.ttlSeconds;

  const { data, error } = await client.storage
    .from(config.bucket)
    .createSignedUrl(config.objectPath, expiresIn, {
      download: DOWNLOAD_FILENAME,
    });

  if (error || !data?.signedUrl) {
    // רק מטא-נתונים בטוחים ללוג - אין URL, נתיב, מפתח או הודעת ספק.
    console.error(formatStorageErrorLog(classifyStorageError(error)));
    throw new StorageError("signing_failed");
  }

  return data.signedUrl;
}

/**
 * בדיקת הרשאה: האם ההזמנה שסופקה במפורש היא הזמנה משולמת ומאומתת.
 * מחזיר true אך ורק כאשר paymentStatus === "paid".
 * דוחה pending / failed / cancelled / חסר / לא ידוע.
 */
export function isPaidOrder(
  order: unknown
): order is Order & { paymentStatus: "paid" } {
  return (
    !!order &&
    typeof order === "object" &&
    (order as { paymentStatus?: unknown }).paymentStatus === "paid"
  );
}

/**
 * מנפיק קישור הורדה חתום עבור הזמנה משולמת בלבד.
 *
 * זו נקודת הכניסה היחידה שאמורה להנפיק גישה לקובץ הספר. היא מקבלת אובייקט
 * הזמנה מפורש; כתובת מייל בלבד אינה מהווה הרשאה. הפניה למנוי רשימת המתנה או
 * להזמנה שאינה "paid" תידחה בשגיאה מטופסת.
 *
 * מייצר קישור חתום טרי בכל קריאה מורשית. אין לשמור, למטמן או להחזיר את הקישור
 * ל-client כלשהו מלבד ללקוח המורשה של אותה הזמנה משולמת.
 */
export async function issueBookDownloadUrl(
  order: Order | null | undefined
): Promise<string> {
  if (!isPaidOrder(order)) {
    throw new StorageError("order_not_paid");
  }
  return createSignedBookUrl();
}

/** תוצאת אימות מוכנוּת האחסון - מידע בטוח בלבד, ללא הקישור החתום עצמו. */
export type StorageReadiness = {
  /** האם כל משתני התצורה החיוניים קיימים. */
  configured: boolean;
  /** האם ניתן היה לייצר קישור חתום לאובייקט הפרטי (כלומר הוא קיים ונגיש). */
  objectAccessible: boolean;
  /** מוכנוּת כוללת של שכבת האחסון (configured && objectAccessible). */
  ok: boolean;
};

/**
 * אימות שרתי בלבד של מוכנוּת האחסון. מיועד לשימוש פנימי (סקריפט/בדיקה),
 * לא כ-endpoint ציבורי.
 *
 * שלבים:
 * 1. מוודא שקיימת תצורה.
 * 2. מוודא שאפשר לייצר קישור חתום לאובייקט הפרטי (מאשש קיום + הרשאה).
 *
 * מחזיר אך ורק בוליאני/סטטוס בטוח. הקישור החתום נוצר לזמן קצר ומיד מושמט -
 * הוא לעולם אינו מוחזר, מודפס או נכלל בדוח כלשהו.
 */
export async function verifyBookStorage(): Promise<StorageReadiness> {
  if (!isStorageConfigured()) {
    return { configured: false, objectAccessible: false, ok: false };
  }

  try {
    const signedUrl = await createSignedBookUrl(MIN_TTL_SECONDS);
    const objectAccessible = typeof signedUrl === "string" && signedUrl.length > 0;
    return { configured: true, objectAccessible, ok: objectAccessible };
  } catch (err) {
    console.error(formatStorageErrorLog(classifyStorageError(err)));
    return { configured: true, objectAccessible: false, ok: false };
  }
}
