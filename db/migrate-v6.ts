import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/ardean";
const sql = postgres(url, { max: 1 });

const stmts = [
  `ALTER TABLE product ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;`,
  `ALTER TABLE product ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;`,
  `ALTER TABLE product ADD COLUMN IF NOT EXISTS version text;`,
  `ALTER TABLE product ADD COLUMN IF NOT EXISTS license text;`,
  `ALTER TABLE product ADD COLUMN IF NOT EXISTS "demoUrl" text;`,
  `ALTER TABLE product ADD COLUMN IF NOT EXISTS "repoUrl" text;`,
  `ALTER TABLE product ADD COLUMN IF NOT EXISTS "categoryId" integer REFERENCES category(id) ON DELETE SET NULL;`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='page_status') THEN CREATE TYPE page_status AS ENUM ('DRAFT','PUBLISHED'); END IF; END $$;`,
  `CREATE TABLE IF NOT EXISTS page (
     id text PRIMARY KEY,
     slug text NOT NULL UNIQUE,
     title text NOT NULL,
     body jsonb,
     status page_status NOT NULL DEFAULT 'DRAFT',
     "seoTitle" text,
     "seoDescription" text,
     "ogImage" text,
     "showInFooter" boolean NOT NULL DEFAULT true,
     "sortOrder" integer NOT NULL DEFAULT 0,
     "authorId" text REFERENCES "user"(id) ON DELETE SET NULL,
     "createdAt" timestamp NOT NULL DEFAULT now(),
     "updatedAt" timestamp NOT NULL DEFAULT now()
   );`,
  `CREATE TABLE IF NOT EXISTS notification_pref (
     "userId" text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
     comments boolean NOT NULL DEFAULT true,
     replies boolean NOT NULL DEFAULT true,
     follows boolean NOT NULL DEFAULT true,
     "newContent" boolean NOT NULL DEFAULT true
   );`,
];

async function main() {
  for (const stmt of stmts) {
    await sql.unsafe(stmt);
    console.log("ok:", stmt.slice(0, 60).replace(/\s+/g, " ").trim());
  }
  await sql.end();
  console.log("migrate-v6 selesai");
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
