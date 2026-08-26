import { randomBytes } from "node:crypto";

/**
 * אסימון-גישה לערכת-הקורא — אקראי, בלתי-ניתן-לניחוש (128 ביט), hex. משמש
 * כ-capability בקישור המייל: מי שמחזיק אסימון תקין של הפעלה מאושרת רואה את
 * הערכה. שרת-בלבד; אינו PII ואינו נגזר מהאימייל.
 */
export function generateAccessToken(): string {
  return randomBytes(16).toString("hex");
}

/** צורת אסימון תקינה — 32 תווי hex. משמש לסינון מוקדם לפני פניית-מאגר. */
export function isValidAccessTokenShape(token: string | null | undefined): token is string {
  return typeof token === "string" && /^[0-9a-f]{32}$/.test(token);
}
