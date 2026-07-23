import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5432/ardean";
const sql = postgres(url, { max: 1 });

const stmts = [
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='post_visibility') THEN CREATE TYPE post_visibility AS ENUM ('PUBLIC','UNLISTED','PRIVATE'); END IF; END $$;`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='product_kind') THEN CREATE TYPE product_kind AS ENUM ('DIGITAL','SOURCE_CODE','PHYSICAL','SERVICE'); END IF; END $$;`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='product_status') THEN CREATE TYPE product_status AS ENUM ('DRAFT','PUBLISHED','ARCHIVED'); END IF; END $$;`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid WHERE t.typname='post_type' AND e.enumlabel='POST') THEN
       ALTER TABLE post ALTER COLUMN type DROP DEFAULT;
       ALTER TYPE post_type RENAME TO post_type_old;
       CREATE TYPE post_type AS ENUM ('VIDEO','AUDIO','POST','RESOURCE');
       ALTER TABLE post ALTER COLUMN type TYPE post_type USING (CASE type::text WHEN 'ARTICLE' THEN 'POST' ELSE type::text END::post_type);
       ALTER TABLE post ALTER COLUMN type SET DEFAULT 'POST';
       DROP TYPE post_type_old;
     END IF;
   END $$;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS slug text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS excerpt text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS "mediaUrl" text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS "durationSec" integer;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS "repoUrl" text;`,
  `ALTER TABLE post ADD COLUMN IF NOT EXISTS visibility post_visibility NOT NULL DEFAULT 'PUBLIC';`,
  `UPDATE post SET slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '-' || substr(id,1,6) WHERE slug IS NULL OR slug='';`,
  `ALTER TABLE post ALTER COLUMN slug SET NOT NULL;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS post_slug_key ON post(slug);`,
  `ALTER TABLE post DROP COLUMN IF EXISTS price;`,
  `CREATE TABLE IF NOT EXISTS product (
     id text PRIMARY KEY,
     "ownerId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
     title text NOT NULL,
     slug text NOT NULL UNIQUE,
     description text,
     body jsonb,
     kind product_kind NOT NULL DEFAULT 'DIGITAL',
     status product_status NOT NULL DEFAULT 'DRAFT',
     price integer NOT NULL DEFAULT 0,
     thumbnail text,
     stock integer,
     "postId" text REFERENCES post(id) ON DELETE SET NULL,
     "createdAt" timestamp NOT NULL DEFAULT now(),
     "updatedAt" timestamp NOT NULL DEFAULT now()
   );`,
  `ALTER TABLE resource_file ALTER COLUMN "postId" DROP NOT NULL;`,
  `ALTER TABLE resource_file ADD COLUMN IF NOT EXISTS "productId" text REFERENCES product(id) ON DELETE CASCADE;`,
  `CREATE UNIQUE INDEX IF NOT EXISTS resource_file_product_version_idx ON resource_file("productId", version);`,
  `DROP TABLE IF EXISTS entitlement CASCADE;`,
  `CREATE TABLE entitlement (
     "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
     "productId" text NOT NULL REFERENCES product(id) ON DELETE CASCADE,
     source text,
     "createdAt" timestamp NOT NULL DEFAULT now(),
     PRIMARY KEY ("userId","productId")
   );`,
  `ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "productId" text REFERENCES product(id) ON DELETE SET NULL;`,
  `CREATE TABLE IF NOT EXISTS rating (
     "postId" text NOT NULL REFERENCES post(id) ON DELETE CASCADE,
     "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
     stars integer NOT NULL,
     "createdAt" timestamp NOT NULL DEFAULT now(),
     "updatedAt" timestamp NOT NULL DEFAULT now(),
     PRIMARY KEY ("postId","userId")
   );`,
  `CREATE TABLE IF NOT EXISTS app_setting (
     id integer PRIMARY KEY DEFAULT 1,
     value jsonb NOT NULL DEFAULT '{}'::jsonb,
     "updatedAt" timestamp NOT NULL DEFAULT now()
   );`,
  `INSERT INTO app_setting (id, value) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;`,
];

async function main() {
  for (const stmt of stmts) {
    await sql.unsafe(stmt);
    console.log("ok:", stmt.slice(0, 60).replace(/\s+/g, " ").trim());
  }
  await sql.end();
  console.log("migrate-v2 selesai");
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
