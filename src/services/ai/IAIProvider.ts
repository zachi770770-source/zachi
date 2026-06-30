import type { CoachIntent, CoachMessage, CoachResponse, MemoryCard } from "@/types/ai";

export interface ChatInput {
  intent: CoachIntent;
  userText: string;
  history: CoachMessage[];
  memory?: MemoryCard;
}

export interface StreamChunk {
  type: "delta" | "done" | "safety";
  text?: string;
  finalResponse?: CoachResponse;
}

export interface IAIProvider {
  name: "claude" | "openai" | "mock";
  chat(input: ChatInput): Promise<CoachResponse>;
  // Optional: streaming מימוש. אם לא קיים, ה-API route ימחזר ל-chat() רגיל.
  stream?(input: ChatInput): AsyncIterable<StreamChunk>;
}
