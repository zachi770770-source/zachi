export interface IEmbeddingProvider {
  name: "openai" | "mock";
  dimensions: number;
  embed(text: string): Promise<number[]>;
}
