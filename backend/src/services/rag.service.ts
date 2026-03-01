import { db } from "../db";
import { sql } from "drizzle-orm";
import { EmbeddingService } from "./embedding.service";

export class RAGService {
  static async getContextForChapter(
    novelId: number,
    rawContent: string,
    limit = 5,
  ) {
    try {
      console.log("Generating vector for chapter snippet...");
      const snippet = rawContent.substring(0, 500);
      const queryEmbedding = await EmbeddingService.generate(snippet);
      const vectorString = `[${queryEmbedding.join(",")}]`;

      console.log("📚 Searching World Bible for relevant lore...");

      const results = await db.execute(sql`
        SELECT category, entry_name, content
        FROM world_bible
        WHERE novel_id = ${novelId}
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT ${limit}
      `);

      return results as any[];
    } catch (error) {
      console.error("RAG Retrieval Failed:", error);
      return [];
    }
  }
}
