// טיפוסי RAG — חלוקה ל-chunks, embeddings, retrieval

export interface BookChunk {
  id: string;                 // hash של chunk_index + chapter_key
  chapterKey: string;         // 'chapter-1-readiness', 'appendix-a', ...
  chunkIndex: number;
  content: string;            // 200-600 תווים
  metadata: {
    chapterTitle: string;
    section?: string;         // כותרת משנה אם קיימת
    voiceTags: string[];      // קולות שמוזכרים: approval/avoidance/...
    toolTags: string[];       // כלים שמוזכרים: fact-triangle/...
    stationId?: number;       // 1-8 — אם זה פרק תחנה
  };
}

export interface BookChunkWithEmbedding extends BookChunk {
  embedding: number[];        // 1536-dim
}

export interface RetrievedExcerpt {
  content: string;
  chapterTitle: string;
  section?: string;
  score: number;              // 0-1 similarity
}

export interface RetrievalOptions {
  topK?: number;              // default 6
  minScore?: number;          // default 0.3
  voiceFilter?: string[];     // לסנן רק chunks שמוזכר בהם voice מסוים
  toolFilter?: string[];
}
