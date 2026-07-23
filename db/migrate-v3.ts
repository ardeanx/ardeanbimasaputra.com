import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/ardean";
const sql = postgres(url, { max: 1 });

const stmts = [
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS "seoTitle" text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS "seoDescription" text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS "ogImage" text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS "canonicalUrl" text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;`,
  `CREATE TABLE IF NOT EXISTS post_translation (
     "postId" text NOT NULL REFERENCES post(id) ON DELETE CASCADE,
     locale text NOT NULL,
     title text NOT NULL,
     excerpt text,
     body jsonb,
     "seoTitle" text,
     "seoDescription" text,
     auto boolean NOT NULL DEFAULT true,
     "updatedAt" timestamp NOT NULL DEFAULT now(),
     PRIMARY KEY ("postId", locale)
   );`,
  `CREATE TABLE IF NOT EXISTS search_history (
     "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
     query text NOT NULL,
     "updatedAt" timestamp NOT NULL DEFAULT now(),
     PRIMARY KEY ("userId", query)
   );`,
];

async function main() {
  for (const stmt of stmts) {
    await sql.unsafe(stmt);
    console.log("ok:", stmt.slice(0, 60).replace(/\s+/g, " ").trim());
  }
  await sql.end();
  console.log("migrate-v3 selesai");
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
