import { db } from "../db";
import { chapters, glossary } from "../db/schema";
import { eq, and } from "drizzle-orm";

export class TranslationService {
  static async translateChapter(chapterId: number) {
    try {
      const chapter = await db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: { novel: true },
      });

      if (!chapter) throw new Error("Chapter not found");

      const allTerms = await db.query.glossary.findMany({
        where: eq(glossary.novelId, chapter.novelId),
      });

      const relevantTerms = allTerms.filter((term) =>
        chapter.contentRaw.includes(term.chineseTerm),
      );

      const glossaryContext =
        relevantTerms.length > 0
          ? `\nRELEVANT GLOSSARY FOR THIS CHAPTER:\n${relevantTerms.map((t) => `- ${t.chineseTerm}: ${t.englishTerm} (${t.notes || "No notes"})`).join("\n")}`
          : "";

      const systemPrompt = `You are a professional webnovel translator specialized in Xianxia/Wuxia. 
Your goal is to translate the following Chinese text into English.

STRICT RULES:
1. LITERALLY translate all Chinese Idioms (Chengyu). Do not use English equivalents. For example, if the text says "to have eyes but not see Mt. Tai," use that exactly.
2. Use the provided glossary terms exactly as defined.
3. Maintain a formal, epic tone.
${glossaryContext}

Translate only the story content. Do not include any explanations or notes in the output.`;

      await db
        .update(chapters)
        .set({ status: "translating" })
        .where(eq(chapters.id, chapterId));

      const response = await fetch(
        `http://host.docker.internal:11434/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "qwen2.5:7b",
            prompt: `${systemPrompt}\n\nCONTENT TO TRANSLATE:\n${chapter.contentRaw}`,
            stream: false,
          }),
        },
      );

      const data: any = await response.json();

      await db
        .update(chapters)
        .set({
          contentTranslated: data.response,
          status: "completed",
        })
        .where(eq(chapters.id, chapterId));

      console.log(`Successfully translated Chapter ${chapter.chapterNumber}`);
    } catch (error) {
      console.error("Translation failed:", error);
      await db
        .update(chapters)
        .set({ status: "failed" })
        .where(eq(chapters.id, chapterId));
    }
  }
}
