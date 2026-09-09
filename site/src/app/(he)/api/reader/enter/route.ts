import { NextResponse } from "next/server";

import { getReaderClaimRepository } from "@/lib/reader";
import {
  hashAccessToken,
  isValidAccessTokenShape,
} from "@/lib/reader/token";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * החלפת אסימון-הגישה (מקישור-המייל) לעוגיית-סשן HttpOnly. זהו הצעד היחיד שבו
 * האסימון מופיע ב-URL — מיד לאחר מכן הוא חי רק בעוגייה, וה-redirect ל-/reader/kit
 * נקי מאסימון. תשובה אחידה בכשל (redirect ל-/reader#activate) — ללא enumeration.
 */

const SESSION_COOKIE = "reader_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 יום, כמו תוקף האסימון

function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`reader-enter:${ip}`, { limit: 10, windowMs: 60_000 });

  const activateUrl = new URL("/reader#activate", request.url);
  const kitUrl = new URL("/reader/kit", request.url);

  const token = new URL(request.url).searchParams.get("token");

  // מקרה-כשל אחיד: אסימון פסול/חסר/מוגבל-קצב → חזרה להפעלה, בלי לרמז.
  const deny = () => NextResponse.redirect(activateUrl);

  if (!rateLimit.allowed || !isValidAccessTokenShape(token)) return deny();

  const repo = getReaderClaimRepository();
  if (!repo) return deny();

  let approved = false;
  try {
    const claim = await repo.findApprovedByAccessTokenHash(hashAccessToken(token));
    approved = Boolean(claim);
  } catch {
    return deny();
  }
  if (!approved) return deny();

  // אסימון תקף של הפעלה מאושרת → עוגיית-סשן HttpOnly, ו-redirect נקי לערכה.
  const res = NextResponse.redirect(kitUrl);
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
