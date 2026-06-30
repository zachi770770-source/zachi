import type { RetrievedExcerpt } from "@/types/rag";

export interface IVectorStore {
  name: "supabase" | "in-memory";
  search(
    queryEmbedding: number[],
    options?: {
      topK?: number;
      minScore?: number;
      voiceFilter?: string[];
      toolFilter?: string[];
    },
  ): Promise<RetrievedExcerpt[]>;
}
