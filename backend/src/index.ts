import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .get("/", () => "API is online")
  .listen(4000);

console.log(`Backend running at http://localhost:4000`);
