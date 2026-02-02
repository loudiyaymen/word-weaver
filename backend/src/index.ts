import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { NovelService } from "./services/novel.service";

const app = new Elysia()
  .use(cors())
  .get("/", () => "API is online")
  .group("/novels", (app) =>
    app
      // POST /novels - Create a novel
      .post("/", ({ body }) => NovelService.createNovel(body), {
        body: t.Object({
          title: t.String(),
          author: t.Optional(t.String()),
          sourceUrl: t.Optional(t.String()),
        }),
      })
      // POST /novels/:id/chapters - Add a chapter
      .post(
        "/:id/chapters",
        ({ params, body }) => {
          return NovelService.addChapter({
            novelId: parseInt(params.id),
            ...body,
          });
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            contentRaw: t.String(),
            chapterNumber: t.Optional(t.Number()),
            title: t.Optional(t.String()),
          }),
        },
      ),
  )
  .listen(4000);

console.log(`Backend running at http://localhost:4000`);
