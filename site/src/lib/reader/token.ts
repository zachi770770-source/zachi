import { randomBytes, createHash } from "node:crypto";

/**
 * אסימון-גישה לערכת-הקורא — אקראי, בלתי-ניתן-לניחוש (256 ביט), hex. נוצר עם
 * approval, נשלח בקישור-המייל, ומוחלף לעוגיית-סשן HttpOnly דרך /api/reader/enter.
 * במסד נשמר *רק* ה-hash שלו (SHA-256): אסימון גולמי לעולם אינו יושב במסד,
 * ואחרי ה-exchange הוא חי רק בעוגייה HttpOnly — לא ב-URL של הערכה, לא בלוגים,
 * לא באנליטיקה.
 */
export function generateAccessToken(): string {
  return randomBytes(32).toString("hex");
}

/** גיבוב חד-כיווני של האסימון לאחסון/חיפוש במסד. */
export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** צורת אסימון תקינה — 64 תווי hex. סינון מוקדם לפני גיבוב/פניית-מאגר. */
export function isValidAccessTokenShape(token: string | null | undefined): token is string {
  return typeof token === "string" && /^[0-9a-f]{64}$/.test(token);
}
