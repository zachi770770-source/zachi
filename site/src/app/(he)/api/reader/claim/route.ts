import { NextResponse } from "next/server";

import { readerClaimSchema, READER_CLAIM_CONSENT_VERSION } from "@/lib/validation/readerClaim";
import { getReaderClaimRepository } from "@/lib/reader";
import { validateProof, READER_PROOF_MAX_BYTES } from "@/lib/reader/proof";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import { sendReaderClaimReceivedEmail } from "@/lib/email/readerEmail";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/** תקרת גוף הבקשה: קובץ ההוכחה (עד 5MB) + שדות. מרווח קטן מעל תקרת-הקובץ. */
const MAX_BODY_BYTES = READER_PROOF_MAX_BYTES + 64 * 1024;
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

const PROOF_ERROR: Record<string, string> = {
  empty: "קובץ ההוכחה ריק. צרפו צילום-מסך או PDF של אישור הרכישה.",
  too_large: "הקובץ גדול מדי (עד 5MB).",
  unsupported_type: "סוג הקובץ אינו נתמך. אפשר תמונה (PNG/JPG/WEBP) או PDF.",
};

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`reader-claim:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "יותר מדי בקשות. נסו שוב בעוד דקה." },
      { status: 429 },
    );
  }

  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return NextResponse.json({ error: "סוג תוכן לא נתמך" }, { status: 415 });
  }
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "מקור הבקשה אינו מורשה" }, { status: 403 });
  }

  // חסימת-גודל מוקדמת לפי content-length (אם קיים) — לפני קריאת הגוף.
  const declaredLen = Number(request.headers.get("content-length") ?? "0");
  if (declaredLen > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "גוף הבקשה גדול מדי" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const consentRaw = form.get("consent");
  const parsed = readerClaimSchema.safeParse({
    email: String(form.get("email") ?? ""),
    consent: consentRaw === "true" || consentRaw === "on",
    company: String(form.get("company") ?? ""),
  });
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

  // הוכחת-הרכישה — קובץ חובה, מאומת לפי חתימת-בתים וגודל (לא לפי הצהרת-הדפדפן).
  // בדיקת-ברווז ולא instanceof: מקורות שונים של Blob/File (runtime מול בדיקות)
  // שוברים instanceof בין-מרחבים; File אמיתי הוא כל ערך-לא-מחרוזת עם size+arrayBuffer.
  const file = form.get("proof");
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return NextResponse.json(
      { error: "יש לצרף הוכחת רכישה (צילום-מסך או PDF)." },
      { status: 400 },
    );
  }
  if (file.size > READER_PROOF_MAX_BYTES) {
    return NextResponse.json({ error: PROOF_ERROR.too_large }, { status: 413 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const proof = validateProof(bytes);
  if (!proof.ok) {
    return NextResponse.json(
      { error: PROOF_ERROR[proof.reason] ?? "קובץ ההוכחה אינו תקין." },
      { status: proof.reason === "too_large" ? 413 : 400 },
    );
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
      emailNormalized: parsed.data.email,
      consentVersion: READER_CLAIM_CONSENT_VERSION,
      proof: { mime: proof.mime, bytes },
    });
  } catch (err) {
    console.error(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
    return NextResponse.json(
      { error: "אירעה תקלה בשמירת הבקשה. נסו שוב." },
      { status: 500 },
    );
  }

  // אישור-קבלה במייל — best-effort בלבד (הרשומה כבר נשמרה כ-pending).
  try {
    await sendReaderClaimReceivedEmail({ to: parsed.data.email });
  } catch {
    /* לא-קריטי */
  }

  return NextResponse.json(SUCCESS);
}
