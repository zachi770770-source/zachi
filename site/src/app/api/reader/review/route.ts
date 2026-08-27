import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { getReaderClaimRepository } from "@/lib/reader";
import { generateAccessToken, hashAccessToken } from "@/lib/reader/token";
import { sendReaderKitAccessEmail } from "@/lib/email/readerEmail";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";

/**
 * בדיקה ידנית *מאובטחת-שרת* של הפעלות ערכת-הקורא — נתיב-אדמין מוגן בסוד שרת-בלבד
 * (`READER_ADMIN_TOKEN`, Authorization: Bearer). זהו ה-verification האמיתי:
 *   GET             → רשימת הפעלות ממתינות (מטא-דאטה).
 *   GET ?email=…&proof=1 → הוכחת-הרכישה עצמה (bytes) לצפייה — מוגן, לעולם לא ציבורי.
 *   POST {email,action}  → approve/reject. approve מפיק אסימון-גישה ושולח מייל.
 * אין חשיפת מצב מאושר ללא approval אמיתי.
 */

/** תוקף אסימון-הגישה: 90 יום. */
const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 90;

const reviewSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  action: z.enum(["approve", "reject"]).default("approve"),
});

/** השוואת-סוד עמידה-לתזמון; שני הצדדים מאותו אורך. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function authorize(request: Request): { ok: true } | { ok: false; res: NextResponse } {
  const adminToken = process.env.READER_ADMIN_TOKEN;
  if (!adminToken) {
    return { ok: false, res: NextResponse.json({ error: "unavailable" }, { status: 503 }) };
  }
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!bearer || !secretMatches(bearer, adminToken)) {
    return { ok: false, res: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

export async function GET(request: Request) {
  const auth = authorize(request);
  if (!auth.ok) return auth.res;

  const repo = getReaderClaimRepository();
  if (!repo) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();

  try {
    // צפייה בהוכחה עצמה (bytes) — מוגן-אדמין, נשלח inline, לעולם לא URL ציבורי.
    if (email && url.searchParams.get("proof")) {
      const proof = await repo.getProof(email);
      if (!proof) return NextResponse.json({ error: "not_found" }, { status: 404 });
      return new NextResponse(new Uint8Array(proof.bytes), {
        status: 200,
        headers: {
          "content-type": proof.mime,
          "content-disposition": "inline",
          "cache-control": "no-store",
        },
      });
    }

    const pending = await repo.listPending(100);
    return NextResponse.json({ ok: true, pending });
  } catch (err) {
    console.error(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = authorize(request);
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const repo = getReaderClaimRepository();
  if (!repo) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  try {
    if (parsed.data.action === "reject") {
      await repo.reject(parsed.data.email);
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    // approve → אסימון-גישה חד-פעמי; במסד רק ה-hash. מייל עם קישור ה-enter.
    const token = generateAccessToken();
    const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
    const claim = await repo.approve(parsed.data.email, hashAccessToken(token), expiresAt);
    if (!claim) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const enterUrl = `${new URL(request.url).origin}/api/reader/enter?token=${token}`;
    // best-effort: גם אם המייל אינו מוגדר, האישור תקף — מחזירים את הקישור לאדמין.
    const email = await sendReaderKitAccessEmail({ to: parsed.data.email, enterUrl });

    return NextResponse.json({ ok: true, status: "approved", enterUrl, emailSent: email.ok });
  } catch (err) {
    console.error(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
