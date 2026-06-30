/**
 * סקריפט אינדוקס הספר ל-RAG.
 *
 * שימוש:
 *   1. וודא ש-content/book/manuscript.txt עדכני.
 *   2. הגדר ENV: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *   3. הרץ: npx tsx scripts/index-book.ts
 *
 * הסקריפט:
 *   - קורא את הספר
 *   - מחלק ל-chunks (300-700 תווים)
 *   - מחשב embeddings (OpenAI text-embedding-3-small)
 *   - שומר ב-Supabase: book_chunks (עם pgvector)
 *
 * הרצה חוזרת מוחקת את כל book_chunks ובונה מחדש (idempotent).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chunkBook } from "./lib/chunker";

const BOOK_PATH = join(process.cwd(), "content/book/manuscript.txt");
const BATCH_SIZE = 50;

async function embed(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embeddings failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

async function upsertBatch(
  supabaseUrl: string,
  serviceKey: string,
  rows: Array<{
    id: string;
    chapter_key: string;
    chunk_index: number;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  }>,
) {
  const res = await fetch(`${supabaseUrl}/rest/v1/book_chunks`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert failed: ${res.status} ${body}`);
  }
}

async function deleteAll(supabaseUrl: string, serviceKey: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1/book_chunks?id=gte.0`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Supabase delete failed: ${res.status} ${body}`);
  }
}

async function main() {
  console.log("📚 Indexing book to RAG store…");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
  }

  const raw = readFileSync(BOOK_PATH, "utf8");
  const chunks = chunkBook(raw);
  console.log(`✓ Split into ${chunks.length} chunks`);

  // סטטיסטיקה לפי פרק
  const perChapter: Record<string, number> = {};
  for (const c of chunks) perChapter[c.chapterKey] = (perChapter[c.chapterKey] ?? 0) + 1;
  console.log("  Distribution:");
  for (const [k, n] of Object.entries(perChapter)) console.log(`    ${k}: ${n}`);

  console.log("⏳ Wiping existing book_chunks table…");
  await deleteAll(supabaseUrl, serviceKey);

  console.log("⏳ Embedding + uploading…");
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embed(batch.map((c) => c.content));
    const rows = batch.map((c, j) => ({
      id: c.id,
      chapter_key: c.chapterKey,
      chunk_index: c.chunkIndex,
      content: c.content,
      embedding: embeddings[j],
      metadata: c.metadata,
    }));
    await upsertBatch(supabaseUrl, serviceKey, rows);
    console.log(`  Batch ${i / BATCH_SIZE + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} ✓`);
  }

  console.log(`✅ Done. ${chunks.length} chunks indexed.`);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
