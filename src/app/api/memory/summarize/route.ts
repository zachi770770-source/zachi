/**
 * /api/memory/summarize
 *
 * מקבל שיחה, מחזיר סיכום קצר שיכנס ל-MemoryCard בעתיד.
 * Phase 3: רץ on-demand מהקליינט אחרי שיחה שהסתיימה.
 * Phase 4 (עתיד): רץ אוטומטית ב-background, נשמר ב-Supabase.
 */

import { NextResponse } from "next/server";
import { summarizeConversation } from "@/services/memory/summarizer";
import type { CoachMessage } from "@/types/ai";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: Request) {
  let body: { messages: CoachMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  try {
    const summary = await summarizeConversation(body.messages);
    return NextResponse.json({ summary });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[/api/memory/summarize] error:", err);
    return NextResponse.json({ summary: "" }, { status: 200 });
  }
}
