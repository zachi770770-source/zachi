import { getAIProvider } from "./providerFactory";
import type { ChatInput } from "./IAIProvider";
import type { CoachResponse } from "@/types/ai";
import { buildMemoryCard } from "./memoryCard";
import type { AppStateSnapshot } from "./memoryCard";

export async function askCoach(
  input: Omit<ChatInput, "memory">,
  appState: AppStateSnapshot,
): Promise<CoachResponse> {
  const memory = buildMemoryCard(appState);
  const provider = getAIProvider();
  return provider.chat({ ...input, memory });
}
