import assert from "node:assert";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { genId } from "../lib/id";
import { post, user } from "./schema";

const body = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2, textAlign: "center" },
      content: [{ type: "text", text: "Judul Tengah" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Teks " },
        { type: "text", marks: [{ type: "highlight" }], text: "disorot" },
        { type: "text", text: " lalu biasa." },
      ],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Kolom A" }] }],
            },
            {
              type: "tableHeader",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Kolom B" }] }],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: "sel-satu" }] }],
            },
            {
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: "sel-dua" }] }],
            },
          ],
        },
      ],
    },
    {
      type: "youtube",
      attrs: { src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" },
    },
  ],
};

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  assert(admin, "seed user ada");

  const id = genId();
  await db.insert(post).values({
    id,
    authorId: admin.id,
    title: "CEK Render Blok Baru",
    slug: `cek-render-${id}`,
    type: "POST",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    body,
    publishedAt: new Date(),
  });

  const res = await fetch(`http://localhost:3000/cek-render-${id}`);
  const html = await res.text();
  assert(res.status === 200, "halaman post HTTP 200");
  assert(html.includes("<table"), "tabel dirender");
  assert(html.includes("sel-satu") && html.includes("Kolom A"), "isi tabel dirender");
  assert(html.includes("<mark"), "highlight dirender sebagai <mark>");
  assert(
    html.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ") && html.includes("<iframe"),
    "youtube embed dirender sebagai iframe",
  );
  assert(
    html.includes("text-align:center") || html.includes("text-align: center"),
    "perataan tengah dirender",
  );

  await db.delete(post).where(eq(post.id, id));
  console.log("check-render: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
