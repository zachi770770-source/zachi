import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { IVectorStore } from "../IVectorStore";
import type { RetrievedExcerpt } from "@/types/rag";

interface MatchRow {
  id: string;
  chapter_key: string;
  chunk_index: number;
  content: string;
  metadata: { chapterTitle: string; section?: string; voiceTags?: string[]; toolTags?: string[] };
  similarity: number;
}

export class SupabaseVectorStore implements IVectorStore {
  name = "supabase" as const;
  private client: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  async search(
    queryEmbedding: number[],
    options?: {
      topK?: number;
      minScore?: number;
      voiceFilter?: string[];
      toolFilter?: string[];
    },
  ): Promise<RetrievedExcerpt[]> {
    const { data, error } = await this.client.rpc("match_book_chunks", {
      query_embedding: queryEmbedding,
      match_count: options?.topK ?? 6,
      min_score: options?.minScore ?? 0.3,
      filter_voice_tags: options?.voiceFilter ?? null,
      filter_tool_tags: options?.toolFilter ?? null,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[SupabaseVectorStore.search] RPC error:", error);
      return [];
    }

    return (data as MatchRow[]).map((row) => ({
      content: row.content,
      chapterTitle: row.metadata?.chapterTitle ?? row.chapter_key,
      section: row.metadata?.section,
      score: row.similarity,
    }));
  }
}
