import { NextResponse } from "next/server";

import {
  waitlistSchema,
  WAITLIST_CONSENT_VERSION,
} from "@/lib/validation/waitlist";
import { getWaitlistRepository } from "@/lib/waitlist";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 2_000;
const SUCCESS = { success: true as const };

/** בדיקה שה-Origin (אם קיים) תואם ל-Host — הגנה בסיסית מפני CSRF. */
function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // בקשות ללא Origin (למשל same-origin ישן) מותרות
  try {
    const host = request.headers.get("host");
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`waitlist:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסו שוב בעוד דקה." },
      { status: 429 }
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

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // honeypot מולא → מתנהגים כהצלחה כדי לא לרמז לבוט, אך לא כותבים דבר.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json(SUCCESS);
  }

  const repo = getWaitlistRepository();
  if (!repo) {
    // אין אחסון מתמשך מחובר — לא מדווחים על הצלחה פיקטיבית.
    return NextResponse.json(
      { error: "רשימת ההמתנה אינה זמינה כרגע. נסו שוב מאוחר יותר." },
      { status: 503 }
    );
  }

  const emailNormalized = parsed.data.email; // כבר trim+lowercase בסכימה
  try {
    await repo.add({
      emailNormalized,
      emailOriginal: parsed.data.email,
      source: parsed.data.source,
      consentVersion: WAITLIST_CONSENT_VERSION,
      persona: parsed.data.persona ?? null,
      personaSource: parsed.data.personaSource ?? null,
    });
  } catch (err) {
    // אבחון מאובטח: מדפיסים רק מטא-נתונים לא-רגישים (name / code / cause.code /
    // שלב / סיווג). לעולם לא message / stack / DATABASE_URL / host / user /
    // password / connection string, ולא את כתובת האימייל.
    console.error(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
    return NextResponse.json(
      { error: "אירעה תקלה בשמירת הפרטים. נסו שוב." },
      { status: 500 }
    );
  }

  // תגובה אחידה להרשמה חדשה וקיימת — לא חושפת אם האימייל כבר קיים.
  return NextResponse.json(SUCCESS);
}
