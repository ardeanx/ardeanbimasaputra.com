import assert from "node:assert";
import { type } from "arktype";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { deletePost, moderatePost, savePost } from "../lib/posts";
import { highlight } from "../lib/shiki";
import { postMeta } from "../lib/validators";
import { registerView } from "../lib/views";
import { post, user } from "./schema";

const meta = {
  type: "POST" as const,
  categoryId: null,
  thumbnail: null,
};

const bodyWithCode = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Contoh kode:" }] },
    {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [{ type: "text", text: "const jawaban: number = 42;" }],
    },
  ],
};

async function viewCount(id: string): Promise<number> {
  const row = await db.query.post.findFirst({ where: eq(post.id, id) });
  return row!.viewCount;
}

async function main() {
  const okMeta = postMeta({ ...meta, title: "Valid" });
  assert(!(okMeta instanceof type.errors), "ArkType terima meta valid");
  const badMeta = postMeta({ ...meta, title: "" });
  assert(badMeta instanceof type.errors, "ArkType tolak judul kosong");

  const hl = await highlight("const x = 1;", "typescript");
  assert(hl.includes("shiki") && hl.includes("const"), "Shiki highlight HTML");

  const admin = await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  });
  const member = await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  });
  assert(admin && member, "seed user ada");

  const a = await savePost(
    { id: admin!.id, role: "admin" },
    { meta: { ...meta, title: "CEK Editor Shiki" }, body: bodyWithCode, publish: true },
  );
  assert("id" in a, "admin bisa simpan");
  let row = await db.query.post.findFirst({ where: eq(post.id, a.id) });
  assert(row!.status === "PUBLISHED", "admin publish -> PUBLISHED");
  assert(row!.publishedAt !== null, "publishedAt terisi");
  const stored = row!.body as {
    content: { type: string; attrs?: { language?: string }; content?: { text?: string }[] }[];
  };
  assert(stored.content[1].type === "codeBlock", "codeBlock tersimpan di body");
  assert(stored.content[1].attrs?.language === "typescript", "bahasa kode tersimpan");

  const m = await savePost(
    { id: member!.id, role: "member" },
    {
      meta: { ...meta, title: "CEK Member Review" },
      body: { type: "doc", content: [] },
      publish: true,
    },
  );
  assert("id" in m, "member bisa simpan");
  row = await db.query.post.findFirst({ where: eq(post.id, m.id) });
  assert(row!.status === "REVIEW", "member terbit -> REVIEW");

  const forbidden = await savePost(
    { id: member!.id, role: "member" },
    {
      id: a.id,
      meta: { ...meta, title: "Bajak" },
      body: { type: "doc", content: [] },
      publish: false,
    },
  );
  assert("error" in forbidden, "member ditolak edit konten admin");

  const before = await viewCount(a.id);
  const f1 = await registerView(a.id, "cek-viewer");
  const f2 = await registerView(a.id, "cek-viewer");
  const after = await viewCount(a.id);
  if (f1 && !f2) {
    assert(after === before + 1, "Redis aktif: dedup -> +1");
    console.log("view: Redis aktif, dedup bekerja");
  } else {
    assert(after >= before + 1, "Redis mati: fail-open");
    console.log("view: Redis mati, fail-open");
  }

  const modBad = await moderatePost({ id: member!.id, role: "member" }, m.id, "approve");
  assert("error" in modBad, "member tak bisa memoderasi");
  const modOk = await moderatePost({ id: admin!.id, role: "admin" }, m.id, "approve");
  assert("ok" in modOk, "admin bisa memoderasi");
  const mrow = await db.query.post.findFirst({ where: eq(post.id, m.id) });
  assert(mrow!.status === "PUBLISHED", "moderasi approve REVIEW -> PUBLISHED");
  assert(mrow!.publishedAt !== null, "publishedAt terisi saat disetujui");

  const arow = await db.query.post.findFirst({ where: eq(post.id, a.id) });
  const res = await fetch(`http://localhost:3000/post/${arow!.slug}`);
  const html = await res.text();
  assert(res.status === 200, "halaman post HTTP 200");
  assert(html.includes('class="shiki'), "post render blok kode Shiki");
  assert(html.includes("42"), "isi kode ter-highlight di halaman");
  const wres = await fetch(`http://localhost:3000/watch?v=${a.id}`);
  const whtml = await wres.text();
  assert(
    whtml.includes(`/post/${arow!.slug}`),
    "watch utk POST membawa redirect/canonical ke /post/[slug]",
  );
  console.log("E2E post + Shiki + redirect watch: OK");

  const delMember = await deletePost({ id: member!.id, role: "member" }, a.id);
  assert("error" in delMember, "member ditolak hapus konten admin");
  const delAdmin = await deletePost({ id: admin!.id, role: "admin" }, a.id);
  assert("ok" in delAdmin, "admin bisa hapus");
  await deletePost({ id: member!.id, role: "member" }, m.id);
  const gone = await db.query.post.findFirst({ where: eq(post.id, a.id) });
  assert(!gone, "konten terhapus");

  console.log("check-phase2: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
