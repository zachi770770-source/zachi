import type { CoachIntent } from "@/types";
import type { RetrievedExcerpt } from "@/types/rag";
import { OpenAIEmbeddings } from "./embeddings/OpenAIEmbeddings";
import { SupabaseVectorStore } from "./stores/SupabaseVectorStore";

// Lazy singletons — מאותחלים פעם אחת.
let store: SupabaseVectorStore | null = null;
let embedder: OpenAIEmbeddings | null = null;

function getStore(): SupabaseVectorStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  store = new SupabaseVectorStore(url, key);
  return store;
}

function getEmbedder(): OpenAIEmbeddings {
  if (embedder) return embedder;
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  embedder = new OpenAIEmbeddings(key);
  return embedder;
}

interface RetrieveInput {
  query: string;
  intent: CoachIntent;
  topK?: number;
}

/**
 * שולף top-K excerpts הכי רלוונטיים מהספר עבור שאילתה.
 * משלב intent → voice/tool filter (כדי לכוון את החיפוש לחלקי הספר הנכונים).
 */
export async function retrieveExcerpts(
  input: RetrieveInput,
): Promise<RetrievedExcerpt[]> {
  // intent-aware filtering: כשהמשתמש מבקש "תרגול שיחות", סנן רק chunks שמדברים על
  // הכלים הרלוונטיים (התחלה רכה, האחוז האחד, וכו').
  const toolFilter = intentToToolHint(input.intent);

  const embedding = await getEmbedder().embed(input.query);
  const results = await getStore().search(embedding, {
    topK: input.topK ?? 6,
    minScore: 0.3,
    toolFilter,
  });

  // אם פילטר החזיר מעט מדי, חזור על החיפוש בלי פילטר.
  if (results.length < 3) {
    const fallback = await getStore().search(embedding, {
      topK: input.topK ?? 6,
      minScore: 0.25,
    });
    return fallback;
  }
  return results;
}

function intentToToolHint(intent: CoachIntent): string[] | undefined {
  switch (intent) {
    case "situation":
      return undefined; // רחב — אל תסנן
    case "date":
      return ["spark-test", "chemistry-vs-movement", "gate-questions"];
    case "journal":
      return ["whos-driving", "fact-triangle"];
    case "plan":
      return undefined;
    case "conversation":
      return [
        "soft-start",
        "complaint-to-request",
        "one-percent",
        "timeout-with-return",
      ];
    default:
      return undefined;
  }
}
