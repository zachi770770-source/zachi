import { randomBytes, createHash } from "node:crypto";

/**
 * אסימון-סשן לערכת-הקורא — אקראי, בלתי-ניתן-לניחוש (256 ביט), hex. נשמר
 * *רק* בעוגייה HttpOnly של הדפדפן; במסד נשמר אך ורק ה-hash שלו (SHA-256).
 * כך אסימון גולמי לעולם אינו יושב במסד, ב-URL, בלוגים או באנליטיקה.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** גיבוב חד-כיווני של האסימון לאחסון/חיפוש במסד. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** צורת אסימון-סשן תקינה — 64 תווי hex. סינון מוקדם לפני גיבוב/פניית-מאגר. */
export function isValidSessionTokenShape(token: string | null | undefined): token is string {
  return typeof token === "string" && /^[0-9a-f]{64}$/.test(token);
}
