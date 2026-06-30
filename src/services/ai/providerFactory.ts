import type { IAIProvider } from "./IAIProvider";
import { MockProvider } from "./providers/MockProvider";

// ב־Phase 2 יתווסף ClaudeProvider אמיתי.
// בחירת ספק לפי משתנה סביבה — בלי לגעת בקוד הקומפוננטות.
let cached: IAIProvider | null = null;

export function getAIProvider(): IAIProvider {
  if (cached) return cached;
  const name = process.env.NEXT_PUBLIC_AI_PROVIDER ?? "mock";
  switch (name) {
    case "mock":
    default:
      cached = new MockProvider();
      return cached;
  }
}
