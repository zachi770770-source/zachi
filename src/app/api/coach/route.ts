/**
 * /api/coach
 *
 * נקודת הקצה היחידה לקריאות AI ב-Phase 2+.
 *
 * Modes:
 * - Default: מחזיר תשובה שלמה כ-JSON.
 * - Streaming (?stream=1): SSE שמשגר deltas של טקסט, ובסוף ה-finalResponse המובנה.
 *
 * הקליינט בוחר את המצב לפי תמיכת הספק.
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
  const url = new URL(request.url);
  const isStreaming = url.searchParams.get("stream") === "1";

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
    const chatInput: ChatInput = {
      intent: body.intent,
      userText: body.userText,
      history: body.history ?? [],
      memory: body.memory,
    };

    if (isStreaming && provider.stream) {
      // Server-Sent Events stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of provider.stream!(chatInput)) {
              const line = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(line));
            }
            controller.close();
          } catch (err) {
            const errorChunk = {
              type: "done",
              finalResponse: {
                facts: "משהו השתבש בצד שלנו.",
                story: "",
                nextAction: "נסה שוב בעוד דקה.",
              },
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`),
            );
            controller.close();
            // eslint-disable-next-line no-console
            console.error("[/api/coach stream] error:", err);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        },
      });
    }

    // Non-streaming fallback
    const response = await provider.chat(chatInput);
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
