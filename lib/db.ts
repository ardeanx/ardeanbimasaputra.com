import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.client ??
  postgres(process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/ardean", {
    max: 10,
    idle_timeout: 20,
    connection: { timezone: "UTC" },
  });

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
