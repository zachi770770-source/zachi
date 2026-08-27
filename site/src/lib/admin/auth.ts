import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * אימות אדמין ל-Dashboard הניהולי. משתמש חוזר על אותו סוד-שרת של הבדיקה הידנית
 * (`READER_ADMIN_TOKEN`) — סוד יחיד, שרת-בלבד. אין טבלת-משתמשים ואין סיסמאות
 * במסד: הכניסה היא בהוכחת ידיעת-הסוד, וממנה נגזרת עוגיית-סשן HttpOnly חתומה
 * (stateless, עם תפוגה). הסוד עצמו לעולם אינו נשמר בעוגייה — רק חתימת-HMAC.
 */

const ADMIN_COOKIE = "admin_session";
/** תוקף סשן-אדמין: 12 שעות. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const VERSION = "v1";

export { ADMIN_COOKIE };

/** הסוד המגדיר את קיום-התכונה. ריק → ה-Dashboard אינו זמין (503). */
export function getAdminSecret(): string | null {
  const s = process.env.READER_ADMIN_TOKEN;
  return s && s.length > 0 ? s : null;
}

export function isAdminConfigured(): boolean {
  return getAdminSecret() !== null;
}

function sign(message: string, secret: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** השוואת-סוד עמידה-לתזמון בין הסיסמה שהוזנה לסוד השרת. */
export function verifyAdminPassword(provided: string): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** יוצר ערך-עוגייה חתום עם תפוגה: `v1.<exp>.<nonce>.<hmac>`. */
export function issueSessionToken(now = Date.now()): string | null {
  const secret = getAdminSecret();
  if (!secret) return null;
  const exp = now + SESSION_TTL_MS;
  const nonce = randomBytes(8).toString("hex");
  const payload = `${VERSION}.${exp}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** מאמת ערך-עוגייה: חתימה תקינה + לא פג. */
export function verifySessionToken(
  token: string | undefined | null,
  now = Date.now(),
): boolean {
  const secret = getAdminSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, expStr, nonce, mac] = parts;
  if (version !== VERSION) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const expected = sign(`${version}.${expStr}.${nonce}`, secret);
  return safeEqualHex(mac, expected);
}

export const ADMIN_SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
