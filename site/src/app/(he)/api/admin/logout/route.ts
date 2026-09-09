import { NextResponse } from "next/server";

import { ADMIN_COOKIE } from "@/lib/admin/auth";

/** יציאה: מוחק את עוגיית-הסשן של האדמין. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: ADMIN_COOKIE, value: "", httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
