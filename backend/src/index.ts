import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { NovelService } from "./services/novel.service";
import { TranslationService } from "./services/translation.service";
import { db } from "./db";

const app = new Elysia()
  .use(cors())
  .get("/", () => "API is online")
  .group("/novels", (app) =>
    app
      .post("/", ({ body }) => NovelService.createNovel(body), {
        body: t.Object({
          title: t.String(),
          author: t.Optional(t.String()),
          sourceUrl: t.Optional(t.String()),
        }),
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
      ),
  )
  .group("/chapters", (app) =>
    app
      .get(
        "/:id",
        async ({ params, set }) => {
          // Changed 'error' to 'set' for standard status setting
          const id = parseInt(params.id);

          const chapter = await db.query.chapters.findFirst({
            // Explicitly typing the callback parameters for Drizzle
            where: (chapters: any, { eq }: any) => eq(chapters.id, id),
            with: {
              novel: true,
            },
          });

          if (!chapter) {
            set.status = 404;
            return { error: "Chapter not found in database" };
          }

          return chapter;
        },
        {
          params: t.Object({ id: t.String() }),
        },
      )
      .post(
        "/:id/translate",
        async ({ params }) => {
          const id = parseInt(params.id);
          TranslationService.translateChapter(id).catch(console.error);
          return { message: "Translation started" };
        },
        {
          params: t.Object({ id: t.String() }),
        },
      )
      .get(
        "/:id/glossary",
        async ({ params }) => {
          return db.query.glossary.findMany({
            where: (glossary, { eq }) =>
              eq(glossary.novelId, parseInt(params.id)),
          });
        },
        {
          params: t.Object({ id: t.String() }),
        },
      ),
  )
  .listen(4000);

console.log(`Backend running at http://localhost:4000`);
