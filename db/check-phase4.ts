import assert from "node:assert";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import {
  bookmarkFeed,
  historyFeed,
  isBookmarked,
  likedFeed,
  recordView,
  toggleBookmark,
  toggleLike,
} from "../lib/community";
import { db } from "../lib/db";
import { genId } from "../lib/id";
import { savePost } from "../lib/posts";
import {
  addResourceFile,
  canDownload,
  deleteResourceFile,
  grantEntitlement,
  hasEntitlement,
  listResourceFiles,
  nextVersion,
} from "../lib/resources";
import { privatePath } from "../lib/storage";
import { post, product, resourceFile, user } from "./schema";

const base = {
  type: "RESOURCE" as const,
  categoryId: null,
  thumbnail: null,
};

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  const member = (await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  }))!;
  assert(admin && member, "seed user ada");
  const adminActor = { id: admin.id, role: "admin" };
  const memberActor = { id: member.id, role: "member" };

  const showcase = await savePost(adminActor, {
    meta: { ...base, title: "CEK Resource Showcase" },
    body: { type: "doc", content: [] },
    publish: true,
  });
  assert("id" in showcase, "post resource showcase dibuat");
  const postId = showcase.id;

  const v1data = Buffer.from("konten berkas versi 1");
  const v2data = Buffer.from("konten berkas versi 2 lebih panjang");
  const r1 = await addResourceFile(postId, "kode.zip", v1data);
  assert("id" in r1, "unggah v1");
  const r2 = await addResourceFile(postId, "kode.zip", v2data);
  assert("id" in r2, "unggah v2");

  const row1 = await db.query.resourceFile.findFirst({
    where: eq(resourceFile.id, r1.id),
  });
  assert(row1?.version === 1, "versi pertama = 1");
  const disk = await readFile(privatePath(row1!.storageKey));
  assert(disk.equals(v1data), "berkas tersimpan utuh di disk privat");
  assert(
    createHash("sha256").update(disk).digest("hex") === row1!.sha256,
    "sha256 integritas cocok",
  );
  assert((await nextVersion(postId)) === 3, "nextVersion -> 3 setelah 2 berkas");

  const files = await listResourceFiles(postId);
  assert(files.length === 2 && files[0].version === 2, "list urut versi desc");

  const pubFile = {
    post: { authorId: admin.id, status: "PUBLISHED" },
    product: null,
  };
  assert(
    (await canDownload(null, pubFile)) === true,
    "berkas post terbit: gratis untuk siapa saja",
  );
  const draftFile = {
    post: { authorId: admin.id, status: "DRAFT" },
    product: null,
  };
  assert(
    (await canDownload(memberActor, draftFile)) === false,
    "berkas post draft: member lain tak bisa unduh",
  );
  assert(
    (await canDownload(adminActor, draftFile)) === true,
    "berkas post draft: penulis tetap bisa unduh",
  );

  const prodId = genId();
  await db.insert(product).values({
    id: prodId,
    ownerId: admin.id,
    title: "CEK Produk Berbayar",
    slug: `cek-produk-${prodId}`,
    kind: "SOURCE_CODE",
    status: "PUBLISHED",
    price: 150000,
  });
  const paidFile = {
    post: null,
    product: { id: prodId, ownerId: admin.id, price: 150000, status: "PUBLISHED" },
  };
  assert((await canDownload(null, paidFile)) === false, "produk berbayar: anon tak bisa unduh");
  assert(
    (await canDownload(memberActor, paidFile)) === false,
    "produk berbayar: member non-pembeli tak bisa unduh",
  );
  assert(
    (await canDownload(adminActor, paidFile)) === true,
    "produk berbayar: pemilik/admin bisa unduh",
  );
  await grantEntitlement(member.id, prodId, "test");
  assert(await hasEntitlement(member.id, prodId), "entitlement produk tercatat");
  assert(
    (await canDownload(memberActor, paidFile)) === true,
    "produk berbayar: member ber-entitlement bisa unduh",
  );

  const freeProdFile = {
    post: null,
    product: { id: "x", ownerId: admin.id, price: 0, status: "PUBLISHED" },
  };
  assert((await canDownload(null, freeProdFile)) === true, "produk gratis terbit: anon bisa unduh");

  const badDel = await deleteResourceFile(memberActor, r1.id);
  assert("error" in badDel, "non-pemilik tak bisa hapus berkas");
  const okDel = await deleteResourceFile(adminActor, r1.id);
  assert("ok" in okDel, "penulis bisa hapus berkas");

  const b1 = await toggleBookmark(memberActor, postId);
  assert(b1.saved && (await isBookmarked(member.id, postId)), "bookmark on");
  assert(
    (await bookmarkFeed(member.id)).some((p) => p.id === postId),
    "feed baca-nanti memuat post",
  );
  const b2 = await toggleBookmark(memberActor, postId);
  assert(!b2.saved, "bookmark off (toggle)");

  await recordView(member.id, postId);
  assert(
    (await historyFeed(member.id)).some((p) => p.id === postId),
    "riwayat memuat post yang ditonton",
  );

  await toggleLike(memberActor, postId);
  assert(
    (await likedFeed(member.id)).some((p) => p.id === postId),
    "feed disukai memuat post",
  );

  await db.delete(product).where(eq(product.id, prodId));
  await db.delete(post).where(eq(post.id, postId));

  console.log("check-phase4: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
