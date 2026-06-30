import type { CoachIntent, CoachMessage, CoachResponse, MemoryCard } from "@/types/ai";

export interface ChatInput {
  intent: CoachIntent;
  userText: string;
  history: CoachMessage[];
  memory?: MemoryCard;
}

export interface IAIProvider {
  name: "claude" | "openai" | "mock";
  chat(input: ChatInput): Promise<CoachResponse>;
}
