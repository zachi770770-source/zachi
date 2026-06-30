/**
 * coachClient — שכבת הקריאה מצד הקליינט.
 * תמיד עוברת דרך /api/coach.
 *
 * שני מצבים:
 * - askCoachClient (non-streaming) — מחזיר response שלם
 * - streamCoachClient (streaming) — generator של deltas
 */

import type { CoachResponse, CoachMessage } from "@/types/ai";
import type { CoachIntent } from "@/types";
import type { StreamChunk } from "./IAIProvider";
import { buildMemoryCard, AppStateSnapshot } from "./memoryCard";

function buildBody(
  intent: CoachIntent,
  userText: string,
  history: CoachMessage[],
  appState: AppStateSnapshot,
) {
  return JSON.stringify({
    intent,
    userText,
    history: history.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    memory: buildMemoryCard(appState),
  });
}

export async function askCoachClient(
  intent: CoachIntent,
  userText: string,
  history: CoachMessage[],
  appState: AppStateSnapshot,
): Promise<CoachResponse> {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: buildBody(intent, userText, history, appState),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body && typeof body === "object" && "facts" in body) {
      return body as CoachResponse;
    }
    throw new Error(`Coach API error ${res.status}`);
  }
  return (await res.json()) as CoachResponse;
}

export async function* streamCoachClient(
  intent: CoachIntent,
  userText: string,
  history: CoachMessage[],
  appState: AppStateSnapshot,
): AsyncGenerator<StreamChunk> {
  const res = await fetch("/api/coach?stream=1", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: buildBody(intent, userText, history, appState),
  });

  if (!res.ok || !res.body) {
    // Fallback: לא תומך streaming — קרא רגיל
    const r = await askCoachClient(intent, userText, history, appState);
    yield { type: "done", finalResponse: r };
    return;
  }

  // ה-content-type אומר לנו אם זה SSE
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    // השרת החזיר JSON רגיל (אולי mock)
    const r = (await res.json()) as CoachResponse;
    yield { type: "done", finalResponse: r };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE format: each event ends with double newline
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        const chunk = JSON.parse(payload) as StreamChunk;
        yield chunk;
      } catch {
        // ignore malformed event
      }
    }
  }
}
