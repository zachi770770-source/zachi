import { NextResponse } from "next/server";

import {
  readerActivationSchema,
  READER_ACTIVATION_CONSENT_VERSION,
} from "@/lib/validation/readerActivation";
import { getReaderAccessRepository } from "@/lib/reader";
import { isReaderActivationConfigured, isValidAccessCode } from "@/lib/reader/accessCodes";
import { generateSessionToken, hashSessionToken } from "@/lib/reader/token";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import { sendReaderKitWelcomeEmail } from "@/lib/email/readerEmail";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 2_000;
/** תוקף הסשן: 30 יום. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_COOKIE = "reader_session";

function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("host");
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** האם הבקשה הגיעה ב-HTTPS (Vercel מציב x-forwarded-proto). קובע את דגל Secure. */
function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`reader-activate:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסו שוב בעוד דקה." },
      { status: 429 },
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "סוג תוכן לא נתמך" }, { status: 415 });
  }
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "מקור הבקשה אינו מורשה" }, { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "גוף הבקשה גדול מדי" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const parsed = readerActivationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // honeypot מולא → מתנהגים כהצלחה בלי להעניק גישה/לכתוב (לא לרמז לבוט).
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  // ההפעלה מוגדרת בסביבה? (לפחות קוד אחד). אם לא — התכונה אינה זמינה.
  if (!isReaderActivationConfigured()) {
    return NextResponse.json(
      { error: "ההפעלה אינה זמינה כרגע. נסו שוב מאוחר יותר." },
      { status: 503 },
    );
  }

  // קוד לא תקף → 401 אחיד (זהה לכל אימייל; rate-limit מגן מפני ניסוי-קודים).
  if (!isValidAccessCode(parsed.data.code)) {
    return NextResponse.json(
      { error: "קוד ההפעלה אינו תקין. בדקו את הקוד שבספר ונסו שוב." },
      { status: 401 },
    );
  }

  const repo = getReaderAccessRepository();
  if (!repo) {
    // אין אחסון מתמשך — לא מדווחים על הצלחה פיקטיבית.
    return NextResponse.json(
      { error: "ההפעלה אינה זמינה כרגע. נסו שוב מאוחר יותר." },
      { status: 503 },
    );
  }

  // אסימון-סשן אקראי: נשלח *רק* כעוגייה HttpOnly; במסד נשמר רק ה-hash שלו.
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  try {
    await repo.activate({
      emailNormalized: parsed.data.email,
      consentVersion: READER_ACTIVATION_CONSENT_VERSION,
      sessionTokenHash: hashSessionToken(token),
      sessionExpiresAt: expiresAt,
    });
  } catch (err) {
    console.error(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
    return NextResponse.json(
      { error: "אירעה תקלה בהפעלה. נסו שוב." },
      { status: 500 },
    );
  }

  // אישור-הפעלה במייל — best-effort בלבד (הגישה כבר פעילה דרך העוגייה).
  // הקישורים אינם נושאים אסימון.
  try {
    const origin = new URL(request.url).origin;
    await sendReaderKitWelcomeEmail({
      to: parsed.data.email,
      kitUrl: `${origin}/reader/kit`,
      activateUrl: `${origin}/reader#activate`,
    });
  } catch {
    /* לא-קריטי */
  }

  // תשובת-הצלחה + עוגיית-סשן HttpOnly. אין אסימון בגוף התשובה ואין ב-URL.
  const res = NextResponse.json({ ok: true });
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
