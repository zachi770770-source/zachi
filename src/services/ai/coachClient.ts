/**
 * coachClient — שכבת הקריאה מצד הקליינט.
 * תמיד עוברת דרך /api/coach.
 * ב-Phase 1 (mock) — גם זה עובד; ה-Mock רץ בצד שרת.
 * ב-Phase 2 (Claude) — קריאה אמיתית.
 */

import type { CoachResponse, CoachMessage } from "@/types/ai";
import type { CoachIntent } from "@/types";
import { buildMemoryCard, AppStateSnapshot } from "./memoryCard";

export async function askCoachClient(
  intent: CoachIntent,
  userText: string,
  history: CoachMessage[],
  appState: AppStateSnapshot,
): Promise<CoachResponse> {
  const memory = buildMemoryCard(appState);

  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      intent,
      userText,
      history: history.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      memory,
    }),
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
