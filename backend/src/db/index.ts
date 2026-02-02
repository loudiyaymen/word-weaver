import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use the environment variable from docker-compose, fallback to local for migrations
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://ww_admin:ww_password@localhost:5432/ww_db";

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
