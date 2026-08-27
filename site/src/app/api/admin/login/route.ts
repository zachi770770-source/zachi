import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  getAdminSecret,
  issueSessionToken,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 1_000;

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
  // הגנה מפני ניחוש-סיסמה: מעט ניסיונות לדקה.
  if (!checkRateLimit(`admin-login:${ip}`, { limit: 5, windowMs: 60_000 }).allowed) {
    return NextResponse.json({ error: "יותר מדי ניסיונות. נסו שוב בעוד דקה." }, { status: 429 });
  }
  if (!getAdminSecret()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
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
  const password = typeof (body as { password?: unknown })?.password === "string"
    ? (body as { password: string }).password
    : "";

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  const token = issueSessionToken();
  if (!token) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    secure: isSecureRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return res;
}
