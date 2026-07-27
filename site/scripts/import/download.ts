/**
 * הורדת קובץ הספר מ-Supabase Storage אל תיקיית עבודה מקומית מוחרגת-Git
 * (.import-tmp/), וחישוב checksum. מודול I/O לסקריפט הייבוא בלבד.
 *
 * לעולם אינו מדפיס מפתחות/סודות. הקובץ, הטקסט המחולץ וה-chunks לעולם לא
 * נכנסים ל-Git (.import-tmp/ מוחרג ב-.gitignore).
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const BUCKET = "books-private";
export const OBJECT_PATH = "medaytim-laahava-888-final.pdf";
/** תיקיית העבודה המקומית — מוחרגת מ-Git. */
export const TMP_DIR = ".import-tmp";

export interface DownloadResult {
  /** נתיב הקובץ שנשמר מקומית. */
  filePath: string;
  /** תוכן הקובץ. */
  data: Uint8Array;
  /** sha256 של תוכן ה-PDF. */
  checksum: string;
  /** גודל בבתים. */
  size: number;
}

function resolveKey(): { key: string; name: string } {
  const secret = process.env.SUPABASE_SECRET_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (secret) return { key: secret, name: "SUPABASE_SECRET_KEY" };
  if (service) return { key: service, name: "SUPABASE_SERVICE_ROLE_KEY" };
  throw new Error("חסר מפתח שרת: SUPABASE_SECRET_KEY או SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * מוריד את ה-PDF מ-Storage (object endpoint, לא info), שומר ל-.import-tmp/,
 * ומחזיר את הנתיב, התוכן וה-checksum. זורק שגיאה ברורה על כשל הרשאה/היעדר.
 */
export async function downloadBook(): Promise<DownloadResult> {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("חסר SUPABASE_URL");
  const { key } = resolveKey();

  const objectUrl = `${url.replace(/\/$/, "")}/storage/v1/object/${BUCKET}/${OBJECT_PATH}`;
  const res = await fetch(objectUrl, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Storage דחה את ההורדה (status ${res.status}) — בדקו את מפתח השרת`);
  }
  if (res.status === 404) {
    throw new Error(`הקובץ לא נמצא: ${BUCKET}/${OBJECT_PATH} (status 404)`);
  }
  if (!res.ok) throw new Error(`הורדת הקובץ נכשלה (status ${res.status})`);

  const buf = new Uint8Array(await res.arrayBuffer());
  const checksum = createHash("sha256").update(buf).digest("hex");

  await mkdir(TMP_DIR, { recursive: true });
  const filePath = path.join(TMP_DIR, OBJECT_PATH);
  await writeFile(filePath, buf);

  return { filePath, data: buf, checksum, size: buf.byteLength };
}
