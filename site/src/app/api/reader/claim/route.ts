import { NextResponse } from "next/server";

import { readerClaimSchema, READER_CLAIM_CONSENT_VERSION } from "@/lib/validation/readerClaim";
import { getReaderClaimRepository } from "@/lib/reader";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import { sendReaderClaimReceivedEmail } from "@/lib/email/readerEmail";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 2_000;
/** תשובת-הצלחה אחידה: תמיד `pending` — לעולם לא „מאומת” לפני approval אמיתי. */
const SUCCESS = { success: true as const, status: "pending" as const };

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

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`reader-claim:${ip}`, { limit: 5, windowMs: 60_000 });
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

  const parsed = readerClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // honeypot מולא → מתנהגים כהצלחה בלי לכתוב דבר (לא לרמז לבוט).
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json(SUCCESS);
  }

  const repo = getReaderClaimRepository();
  if (!repo) {
    // אין אחסון מתמשך — לא מדווחים על הצלחה פיקטיבית.
    return NextResponse.json(
      { error: "ההפעלה אינה זמינה כרגע. נסו שוב מאוחר יותר." },
      { status: 503 },
    );
  }

  try {
    await repo.createPending({
      name: parsed.data.name,
      emailNormalized: parsed.data.email, // כבר trim+lowercase בסכימה
      emailOriginal: parsed.data.email,
      orderRef: parsed.data.orderRef,
      source: parsed.data.source,
      consentVersion: READER_CLAIM_CONSENT_VERSION,
    });
  } catch (err) {
    console.error(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
    return NextResponse.json(
      { error: "אירעה תקלה בשמירת הבקשה. נסו שוב." },
      { status: 500 },
    );
  }

  // אישור-קבלה במייל — best-effort בלבד: כשל בשליחה אינו מבטל את ההפעלה
  // (הרשומה כבר נשמרה כ-pending, שהוא מקור-האמת).
  try {
    await sendReaderClaimReceivedEmail({ to: parsed.data.email, name: parsed.data.name });
  } catch {
    /* לא-קריטי */
  }

  return NextResponse.json(SUCCESS);
}
