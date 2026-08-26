import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { getReaderClaimRepository } from "@/lib/reader";
import { generateAccessToken } from "@/lib/reader/token";
import { sendReaderKitAccessEmail } from "@/lib/email/readerEmail";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";

/**
 * אישור/דחייה *ידני* של הפעלת ערכת-הקורא — נתיב-אדמין מוגן בסוד שרת-בלבד
 * (`READER_ADMIN_TOKEN`, Authorization: Bearer). זהו verification פשוט ונוח
 * לשלב הראשון: אדם מאשר, ואז נשלח מייל-גישה עם אסימון. אין חשיפת מצב מאושר
 * ללא approval אמיתי.
 */

const approveSchema = z.object({
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

export async function POST(request: Request) {
  const adminToken = process.env.READER_ADMIN_TOKEN;
  if (!adminToken) {
    // התכונה אינה מוגדרת בסביבה הזו — לא חושפים דבר, מחזירים 503.
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!bearer || !secretMatches(bearer, adminToken)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const repo = getReaderClaimRepository();
  if (!repo) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  try {
    if (parsed.data.action === "reject") {
      await repo.reject(parsed.data.email);
      return NextResponse.json({ ok: true, status: "rejected" });
    }

    const claim = await repo.approve(parsed.data.email, generateAccessToken());
    if (!claim || !claim.accessToken) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const kitUrl = `${new URL(request.url).origin}/reader/kit?token=${claim.accessToken}`;
    // best-effort: אם המייל אינו מוגדר, האישור עדיין תקף — מחזירים את הקישור
    // לאדמין כדי שיוכל למסור אותו ידנית.
    const email = await sendReaderKitAccessEmail({
      to: parsed.data.email,
      name: parsed.data.email.split("@")[0],
      kitUrl,
    });

    return NextResponse.json({ ok: true, status: "approved", kitUrl, emailSent: email.ok });
  } catch (err) {
    console.error(formatWaitlistDbErrorLog(classifyWaitlistDbError(err)));
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
