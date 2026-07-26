/**
 * סיווג מאובטח של שגיאות אחסון/חתימה לצורך אבחון בלוגים.
 *
 * מדפיסים אך ורק מטא-נתונים לא-רגישים: name, status/code וסיווג מילולי.
 * לעולם לא message / stack / signedUrl / SUPABASE_URL / SUPABASE_SECRET_KEY /
 * שם bucket / נתיב אובייקט / connection string.
 */

export type StorageErrorStage =
  | "configuration"
  | "authorization"
  | "not_found"
  | "signing"
  | "unknown";

export type StorageErrorDiagnosis = {
  name: string;
  status: string;
  stage: StorageErrorStage;
  classification: string;
};

function readSafe(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/**
 * מחלץ מהשגיאה אך ורק שדות בטוחים (name, status/statusCode/code) ומסווג אותה.
 * אינו נוגע ב-message, ב-stack או בכל תוכן חופשי אחר.
 */
export function classifyStorageError(err: unknown): StorageErrorDiagnosis {
  const e = (err ?? {}) as {
    name?: unknown;
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
  };

  const name = readSafe(e.name) || "unknown";
  const status = readSafe(e.status) || readSafe(e.statusCode) || readSafe(e.code);

  let stage: StorageErrorStage = "unknown";
  let classification = "unknown";

  switch (status) {
    case "400":
    case "404":
      stage = "not_found";
      classification = "object_not_found";
      break;
    case "401":
    case "403":
      stage = "authorization";
      classification = "not_authorized";
      break;
    case "429":
      stage = "signing";
      classification = "rate_limited";
      break;
    case "500":
    case "502":
    case "503":
      stage = "signing";
      classification = "storage_unavailable";
      break;
  }

  // שגיאות התצורה המטופסות שלנו (StorageError) - סיווג ייעודי.
  if (name === "StorageError") {
    stage = "configuration";
    classification = "configuration_error";
  }

  return { name, status: status || "none", stage, classification };
}

/** שורת לוג אבחון אחת, מטא-נתונים בלבד. */
export function formatStorageErrorLog(d: StorageErrorDiagnosis): string {
  return `[storage] delivery error name=${d.name} status=${d.status} stage=${d.stage} classification=${d.classification}`;
}
