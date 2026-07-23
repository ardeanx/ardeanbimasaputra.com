import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/ardean";
const sql = postgres(url, { max: 1 });

const stmts = [
  `CREATE TABLE IF NOT EXISTS push_subscription (
     id text PRIMARY KEY,
     "userId" text REFERENCES "user"(id) ON DELETE CASCADE,
     endpoint text NOT NULL UNIQUE,
     p256dh text NOT NULL,
     auth text NOT NULL,
     "createdAt" timestamp NOT NULL DEFAULT now()
   );`,
];

async function main() {
  for (const stmt of stmts) {
    await sql.unsafe(stmt);
    console.log("ok:", stmt.slice(0, 60).replace(/\s+/g, " ").trim());
  }
  await sql.end();
  console.log("migrate-v5 selesai");
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
