import { db } from "../db";
import { chapters, glossary } from "../db/schema";
import { eq } from "drizzle-orm";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://ollama:11434";

export const TranslationService = {
  async translateChapter(chapterId: number) {
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, chapterId),
      with: { novel: true },
    });

    if (!chapter) throw new Error("Chapter not found");

    const novelGlossary = await db.query.glossary.findMany({
      where: eq(glossary.novelId, chapter.novelId),
    });

    const glossaryContext = novelGlossary
      .map(
        (g) =>
          `- ${g.chineseTerm}: ${g.englishTerm}${g.notes ? ` (${g.notes})` : ""}`,
      )
      .join("\n");

    const systemPrompt = `
    You are a professional Chinese-to-English webnovel translator.
    IDIOM RULE:
    - You must translate Chinese idioms (Chengyu) LITERALLY. 
    - For example: "井底之蛙" should be "a frog at the bottom of a well", NOT "narrow-minded".
    - "山外有山" should be "there are mountains beyond mountains", NOT "there is always someone better".
    
    GLOSSARY (Use these exact terms):
    \${glossaryContext || "No specific terms defined yet."}
    Translate the following text accurately while maintaining the original tone.

        `;

    await db
      .update(chapters)
      .set({ status: "translating" })
      .where(eq(chapters.id, chapterId));

    try {
      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2.5:3b",
          prompt: `${systemPrompt}\n\nText to translate:\n${chapter.contentRaw}`,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Error (${response.status}): ${errorText}`);
      }

      const data: any = await response.json();

      if (!data || !data.response) {
        console.error("Invalid Ollama response structure:", data);
        throw new Error("Ollama returned an empty or invalid response");
      }

      const translatedText = data.response;

      await db
        .update(chapters)
        .set({
          contentTranslated: translatedText,
          status: "completed",
        })
        .where(eq(chapters.id, chapterId));

      return translatedText;
    } catch (error) {
      await db
        .update(chapters)
        .set({ status: "failed" })
        .where(eq(chapters.id, chapterId));
      throw error;
    }
  },
};
