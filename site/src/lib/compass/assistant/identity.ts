import "server-only";

import { createHash, randomUUID } from "node:crypto";

/**
 * מזהה אנונימי מאובטח לאכיפת מכסה. מעוגן ב-cookie httpOnly (לא נגיש
 * ל-JavaScript בדפדפן, ולכן שורד רענון וחלון חדש). במסד הנתונים נשמר רק
 * sha256 של המזהה — לא IP, לא אימייל, לא תוכן. אין מעקב אישי.
 */

export const SUBJECT_COOKIE = "compass_uid";
/** ~13 חודשים — כדי שהמכסה תישמר לאורך זמן, לא מתאפסת ברענון. */
export const SUBJECT_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export function newSubjectId(): string {
  return randomUUID();
}

/** sha256 hex של המזהה — הערך היחיד שנשמר במסד. */
export function hashSubject(id: string): string {
  return createHash("sha256").update(id, "utf8").digest("hex");
}

/** אפשרויות ה-cookie (Secure בפרודקשן בלבד כדי לא לשבור פיתוח מקומי ב-http). */
export function subjectCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SUBJECT_COOKIE_MAX_AGE,
  };
}
