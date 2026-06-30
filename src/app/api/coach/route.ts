/**
 * /api/coach
 *
 * נקודת הקצה היחידה לקריאות AI ב-Phase 2.
 * הקליינט שולח: { intent, userText, history, memory }
 * השרת מבצע: safety → RAG retrieval → Claude → quote guard → response.
 *
 * Memory מועבר מהקליינט (Phase 1: localStorage),
 * וב-Phase 2 (כשיהיה Auth) יבוא ישירות מ-Supabase לפי auth.uid().
 */

import { NextResponse } from "next/server";
import { getAIProvider } from "@/services/ai/providerFactory";
import type { ChatInput } from "@/services/ai/IAIProvider";

export const runtime = "nodejs";
export const maxDuration = 30;

interface CoachRequestBody {
  intent: ChatInput["intent"];
  userText: string;
  history?: ChatInput["history"];
  memory?: ChatInput["memory"];
}

export async function POST(request: Request) {
  let body: CoachRequestBody;
  try {
    body = (await request.json()) as CoachRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.intent || !body.userText) {
    return NextResponse.json(
      { error: "Missing required fields: intent, userText" },
      { status: 400 },
    );
  }

  if (body.userText.length > 4000) {
    return NextResponse.json(
      { error: "userText too long (max 4000 chars)" },
      { status: 400 },
    );
  }

  try {
    const provider = await getAIProvider();
    const response = await provider.chat({
      intent: body.intent,
      userText: body.userText,
      history: body.history ?? [],
      memory: body.memory,
    });
    return NextResponse.json(response);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[/api/coach] error:", err);
    return NextResponse.json(
      {
        facts: "משהו השתבש בצד שלנו. אני מצטער על זה.",
        story: "",
        nextAction: "נסה שוב בעוד דקה. אם זה ממשיך — הכלים עצמם זמינים לתרגול בלי המאמן.",
      },
      { status: 500 },
    );
  }
}
