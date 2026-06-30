import type { IEmbeddingProvider } from "../IEmbeddingProvider";

export class OpenAIEmbeddings implements IEmbeddingProvider {
  name = "openai" as const;
  dimensions = 1536;
  private model = "text-embedding-3-small";

  constructor(private apiKey: string) {}

  async embed(text: string): Promise<number[]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI embeddings error ${res.status}: ${body}`);
    }
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    return json.data[0].embedding;
  }
}
