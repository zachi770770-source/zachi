import { getAIProvider } from "./providerFactory";
import type { ChatInput } from "./IAIProvider";
import type { CoachResponse } from "@/types/ai";
import { buildMemoryCard } from "./memoryCard";
import type { AppStateSnapshot } from "./memoryCard";

// כאן נעשית קריאה ל-AI provider — או mock מקומי או Claude אמיתי.
// ב-Phase 2 הקריאה הזאת תעבור דרך API route שמריץ את הכול בצד שרת.
export async function askCoach(
  input: Omit<ChatInput, "memory">,
  appState: AppStateSnapshot,
): Promise<CoachResponse> {
  const memory = buildMemoryCard(appState);
  const provider = await getAIProvider();
  return provider.chat({ ...input, memory });
}
