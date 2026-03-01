export class EmbeddingService {
  static async generate(text: string): Promise<number[]> {
    const ollamaHost =
      process.env.OLLAMA_HOST || "http://host.docker.internal:11434";

    const response = await fetch(`${ollamaHost}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate embedding: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.embedding;
  }
}
