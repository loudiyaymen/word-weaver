import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { NovelService } from "./services/novel.service";
import { TranslationService } from "./services/translation.service";
import { db } from "./db";
import { chapters, novels, glossary, worldBible } from "./db/schema";
import { eq, desc } from "drizzle-orm";
import { EmbeddingService } from "./services/embedding.service";
import { translationQueue } from "./queues/translation.queue";
import "./queues/translation.queue";

const app = new Elysia()
  .use(cors())
  .get("/", () => "API is online")

  .group("/novels", (app) =>
    app
      .get("/", async () => {
        return db.query.novels.findMany({
          orderBy: [desc(novels.createdAt)],
        });
      })
      .post("/", ({ body }) => NovelService.createNovel(body), {
        body: t.Object({
          title: t.String(),
          author: t.Optional(t.String()),
          coverUrl: t.Optional(t.String()),
          sourceUrl: t.Optional(t.String()),
        }),
      })
      .get("/:id/chapters", async ({ params }) => {
        return db.query.chapters.findMany({
          where: eq(chapters.novelId, parseInt(params.id)),
          orderBy: [desc(chapters.chapterNumber)],
        });
      })
      .get("/:id/glossary", async ({ params }) => {
        return db.query.glossary.findMany({
          where: eq(glossary.novelId, parseInt(params.id)),
        });
      })
      .post(
        "/:id/chapters",
        ({ params, body }) => {
          return NovelService.addChapter({
            novelId: parseInt(params.id),
            ...body,
          });
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            contentRaw: t.String(),
            chapterNumber: t.Optional(t.Number()),
            title: t.Optional(t.String()),
          }),
        },
      )
      .post(
        "/:id/glossary",
        ({ params, body }) => {
          return NovelService.addGlossaryTerm({
            novelId: parseInt(params.id),
            ...body,
          });
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            chineseTerm: t.String(),
            englishTerm: t.String(),
            notes: t.Optional(t.String()),
          }),
        },
      )
      .get(
        "/:id/world-bible",
        async ({ params }) => {
          return db.query.worldBible.findMany({
            where: eq(worldBible.novelId, parseInt(params.id)),
            orderBy: (wb, { desc }) => [desc(wb.createdAt)],
          });
        },
        {
          params: t.Object({ id: t.String() }),
        },
      )
      .post(
        "/:id/world-bible",
        async ({ params, body }) => {
          const embedding = await EmbeddingService.generate(body.content);
          const entry = await db
            .insert(worldBible)
            .values({
              novelId: parseInt(params.id),
              category: body.category,
              key: body.key,
              content: body.content,
              embedding: embedding,
            })
            .returning();

          return entry[0];
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            category: t.String(),
            key: t.String(),
            content: t.String(),
          }),
        },
      ),
  )

  .group("/chapters", (app) =>
    app
      .get(
        "/:id",
        async ({ params, set }) => {
          const id = parseInt(params.id);
          const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, id),
            with: { novel: true },
          });

          if (!chapter) {
            set.status = 404;
            return { error: "Chapter not found" };
          }
          return chapter;
        },
        { params: t.Object({ id: t.String() }) },
      )
      .post(
        "/:id/translate",
        async ({ params }) => {
          const id = parseInt(params.id);
          await translationQueue.add("translate-chapter", { chapterId: id });
          return {
            message: "Translation queued successfully. Running in background.",
          };
        },
        {
          params: t.Object({ id: t.String() }),
        },
      )
      .patch(
        "/:id/progress",
        async ({ params, body }) => {
          await db
            .update(chapters)
            .set({ progress: body.progress })
            .where(eq(chapters.id, parseInt(params.id)));
          return { success: true };
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({ progress: t.Number() }),
        },
      ),
  )
  .listen(4000);

console.log(`Backend running at http://localhost:4000`);
