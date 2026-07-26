import "server-only";

/**
 * נקודת הכניסה הציבורית (שרת בלבד) לשכבת אחסון הספר.
 *
 * שימו לב: כל המודול מסומן `server-only`. ייבוא של קובץ זה מתוך Client
 * Component ייכשל ב-build. אין לייבא מכאן דבר לקוד שרץ בדפדפן.
 */

export {
  issueBookDownloadUrl,
  isPaidOrder,
  verifyBookStorage,
  type StorageReadiness,
} from "@/lib/storage/bookDelivery";

export {
  getStorageConfig,
  isStorageConfigured,
  resolveDownloadTtlSeconds,
  MIN_TTL_SECONDS,
  MAX_TTL_SECONDS,
  DEFAULT_TTL_SECONDS,
  type StorageConfig,
} from "@/lib/storage/config";

export {
  StorageError,
  isStorageError,
  type StorageErrorCode,
} from "@/lib/storage/errors";

export {
  classifyStorageError,
  formatStorageErrorLog,
  type StorageErrorStage,
  type StorageErrorDiagnosis,
} from "@/lib/storage/diagnostics";
