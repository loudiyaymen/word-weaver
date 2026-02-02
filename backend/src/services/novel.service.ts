import { db } from "../db";
import { novels, chapters } from "../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const NovelService = {
  async createNovel(data: {
    title: string;
    author?: string;
    sourceUrl?: string;
  }) {
    const [newNovel] = await db.insert(novels).values(data).returning();
    return newNovel;
  },

  async addChapter(data: {
    novelId: number;
    contentRaw: string;
    chapterNumber?: number;
    title?: string;
  }) {
    let finalChapterNumber = data.chapterNumber;
    if (!finalChapterNumber) {
      const lastChapter = await db.query.chapters.findFirst({
        where: eq(chapters.novelId, data.novelId),
        orderBy: [desc(chapters.chapterNumber)],
      });

      finalChapterNumber = lastChapter ? lastChapter.chapterNumber + 1 : 1;
    }

    const [newChapter] = await db
      .insert(chapters)
      .values({
        novelId: data.novelId,
        chapterNumber: finalChapterNumber,
        title: data.title || `Chapter ${finalChapterNumber}`,
        contentRaw: data.contentRaw,
        status: "pending",
      })
      .returning();

    return newChapter;
  },
};
