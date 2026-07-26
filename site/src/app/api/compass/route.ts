import { NextResponse } from "next/server";

import { compassQuestionSchema } from "@/lib/validation/compass";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getCompassDb } from "@/lib/compass/assistant/db";
import { getCompassProvider } from "@/lib/compass/assistant/provider";
import { hasActiveVersion } from "@/lib/compass/search";
import { askCompass } from "@/lib/compass/assistant/assistant";
import { ensureQuotaSchema, consumeQuota, peekQuota } from "@/lib/compass/assistant/quota";
import {
  SUBJECT_COOKIE,
  newSubjectId,
  hashSubject,
  subjectCookieOptions,
} from "@/lib/compass/assistant/identity";
import {
  COMPASS_LIMITS,
  isCompassFeatureEnabled,
} from "@/lib/compass/assistant/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2_000;
const LIMIT_MESSAGE =
  "הגעתם למכסת השאלות. המצפן נועד לטעימה ממוקדת בלבד, לא לשיחה ארוכה. לקריאה מלאה אפשר לפנות אל הספר עצמו.";

/** בדיקה שה-Origin (אם קיים) תואם ל-Host — הגנה בסיסית מפני CSRF. */
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

function readSubject(request: Request): { id: string; isNew: boolean } {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SUBJECT_COOKIE}=([^;]+)`));
  if (match) return { id: decodeURIComponent(match[1]), isNew: false };
  return { id: newSubjectId(), isNew: true };
}

function withSubjectCookie(res: NextResponse, id: string, isNew: boolean): NextResponse {
  if (isNew) res.cookies.set(SUBJECT_COOKIE, id, subjectCookieOptions());
  return res;
}

const LIMITS_PAYLOAD = {
  perDay: COMPASS_LIMITS.perDay,
  lifetime: COMPASS_LIMITS.lifetime,
  maxQuestionChars: COMPASS_LIMITS.maxQuestionChars,
};

/** מצב זמינות משותף ל-GET/POST: התכונה פעילה + ספק + מסד + גרסת ספר פעילה. */
async function resolveAvailability() {
  if (!isCompassFeatureEnabled()) return { available: false as const, db: null };
  const db = getCompassDb();
  if (!db) return { available: false as const, db: null };
  if (!getCompassProvider()) return { available: false as const, db: null };
  return { available: true as const, db };
}

/** GET — מצב וזמינות + כמה שאלות נותרו (לטעינת העמוד). לא צורך מכסה. */
export async function GET(request: Request) {
  const { id, isNew } = readSubject(request);
  const { available, db } = await resolveAvailability();

  if (!available || !db) {
    return withSubjectCookie(
      NextResponse.json({ available: false, limits: LIMITS_PAYLOAD }),
      id,
      isNew
    );
  }

  try {
    await ensureQuotaSchema(db);
    const active = await hasActiveVersion(db);
    if (!active) {
      return withSubjectCookie(
        NextResponse.json({ available: false, limits: LIMITS_PAYLOAD }),
        id,
        isNew
      );
    }
    const quota = await peekQuota(db, hashSubject(id));
    return withSubjectCookie(
      NextResponse.json({ available: true, remaining: quota.remaining, limits: LIMITS_PAYLOAD }),
      id,
      isNew
    );
  } catch {
    return withSubjectCookie(
      NextResponse.json({ available: false, limits: LIMITS_PAYLOAD }),
      id,
      isNew
    );
  }
}

/** POST — שאלה. גוזר מכסה בצד השרת; אינו שומר את השאלה או את התשובה. */
export async function POST(request: Request) {
  // הגנת DoS זולה לפני עבודה כבדה (בנוסף למכסה במסד).
  const ip = getClientIp(request.headers);
  if (!checkRateLimit(`compass:${ip}`, { limit: 8, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "יותר מדי בקשות. נסו שוב בעוד דקה." }, { status: 429 });
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

  const parsed = compassQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "שאלה לא תקינה", limits: LIMITS_PAYLOAD }, { status: 400 });
  }
  // honeypot מולא → מתנהגים כהצלחה נייטרלית בלי לצרוך מכסה או לקרוא למודל.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ available: true, status: "refused", answer: "", limits: LIMITS_PAYLOAD });
  }

  const { id, isNew } = readSubject(request);
  const subjectHash = hashSubject(id);
  const question = parsed.data.question;

  const { available, db } = await resolveAvailability();
  if (!available || !db) {
    // „לא זמין” — לעולם לא תוכן פיקצ׳ר. אינו צורך מכסה.
    return withSubjectCookie(
      NextResponse.json({ available: false, status: "unavailable", limits: LIMITS_PAYLOAD }),
      id,
      isNew
    );
  }

  const provider = getCompassProvider();

  try {
    await ensureQuotaSchema(db);

    // אין גרסת ספר פעילה → „לא זמין”, בלי לצרוך מכסה ובלי לקרוא למודל.
    if (!(await hasActiveVersion(db))) {
      return withSubjectCookie(
        NextResponse.json({ available: false, status: "unavailable", limits: LIMITS_PAYLOAD }),
        id,
        isNew
      );
    }

    // שער מכסה לפני קריאה למודל.
    const gate = await peekQuota(db, subjectHash);
    if (gate.remaining <= 0) {
      return withSubjectCookie(
        NextResponse.json(
          { available: true, status: "limit", answer: LIMIT_MESSAGE, remaining: 0, limits: LIMITS_PAYLOAD },
          { status: 429 }
        ),
        id,
        isNew
      );
    }

    // צריכה אטומית (מונעת מרוץ/כרטיסיות מרובות).
    const quota = await consumeQuota(db, subjectHash);
    if (!quota.allowed) {
      return withSubjectCookie(
        NextResponse.json(
          { available: true, status: "limit", answer: LIMIT_MESSAGE, remaining: 0, limits: LIMITS_PAYLOAD },
          { status: 429 }
        ),
        id,
        isNew
      );
    }

    const { answer } = await askCompass(db, question, provider);

    if (answer.status === "answered") {
      return withSubjectCookie(
        NextResponse.json({
          available: true,
          status: "answered",
          answer: answer.text,
          citation: answer.citation,
          remaining: quota.remaining,
          limits: LIMITS_PAYLOAD,
        }),
        id,
        isNew
      );
    }
    if (answer.status === "refused") {
      return withSubjectCookie(
        NextResponse.json({
          available: true,
          status: "refused",
          answer: answer.text,
          remaining: quota.remaining,
          limits: LIMITS_PAYLOAD,
        }),
        id,
        isNew
      );
    }
    // תיאורטית לא אמור לקרות (זמינות אושרה) — מטופל כ„לא זמין”.
    return withSubjectCookie(
      NextResponse.json({ available: false, status: "unavailable", limits: LIMITS_PAYLOAD }),
      id,
      isNew
    );
  } catch (err) {
    // לוג מאובטח: שם השגיאה בלבד. לעולם לא message/stack/key/DSN/שאלה/תשובה.
    console.error(`compass_error name=${(err as { name?: string })?.name ?? "unknown"}`);
    return withSubjectCookie(
      NextResponse.json({ error: "אירעה תקלה זמנית. נסו שוב." }, { status: 500 }),
      id,
      isNew
    );
  }
}
