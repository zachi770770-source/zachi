import type { IAIProvider } from "./IAIProvider";
import { MockProvider } from "./providers/MockProvider";

// בחירת ספק לפי משתנה סביבה.
// ב-Phase 1: ברירת מחדל = mock (אין צורך במפתחות).
// ב-Phase 2: אם AI_PROVIDER=claude → טוען את ClaudeProvider (server-side בלבד).
let cached: IAIProvider | null = null;

export async function getAIProvider(): Promise<IAIProvider> {
  if (cached) return cached;
  const name = process.env.AI_PROVIDER ?? process.env.NEXT_PUBLIC_AI_PROVIDER ?? "mock";

  if (name === "claude") {
    // dynamic import כדי לא לבנות את ClaudeProvider ב-client bundle
    const { ClaudeProvider } = await import("./providers/ClaudeProvider");
    cached = new ClaudeProvider();
    return cached;
  }

  cached = new MockProvider();
  return cached;
}
