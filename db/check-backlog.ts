import assert from "node:assert";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  listUserPlaylists,
  playlistsForPost,
  togglePlaylistItem,
} from "../lib/playlists";
import { computeDiscount, createCoupon, deleteCoupon, validateCoupon } from "../lib/coupons";
import { parseRepo } from "../lib/github";
import { genId } from "../lib/id";
import { savePost } from "../lib/posts";
import { hasEntitlement } from "../lib/resources";
import { createOrder } from "../lib/store";
import { coupon, playlist, post, product, user } from "./schema";

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  const member = (await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  }))!;
  assert(admin && member, "seed user ada");
  const memberActor = { id: member.id, role: "member" };
  const adminActor = { id: admin.id, role: "admin" };

  const p = await savePost(adminActor, {
    meta: {
      type: "POST" as const,
      categoryId: null,
      thumbnail: null,
      title: "CEK Playlist Post",
    },
    body: { type: "doc", content: [] },
    publish: true,
  });
  assert("id" in p, "post uji dibuat");

  const pl = await createPlaylist(member.id, "Favorit Saya");
  assert("id" in pl, "buat playlist");

  const t1 = await togglePlaylistItem(memberActor, pl.id, p.id);
  assert("added" in t1 && t1.added, "tambah post ke playlist");
  const t2 = await togglePlaylistItem(memberActor, pl.id, p.id);
  assert("added" in t2 && !t2.added, "hapus post (toggle off)");
  await togglePlaylistItem(memberActor, pl.id, p.id);

  const bad = await togglePlaylistItem(adminActor, pl.id, p.id);
  assert("error" in bad, "non-pemilik ditolak mengubah playlist");

  const pf = await playlistsForPost(member.id, p.id);
  assert(
    pf.some((r) => r.id === pl.id && r.has),
    "playlistsForPost menandai keanggotaan",
  );

  const list = await listUserPlaylists(member.id);
  assert(
    list.some((x) => x.id === pl.id && x.count === 1),
    "listUserPlaylists memuat jumlah item",
  );

  const got = await getPlaylist(pl.id, member.id);
  assert(got !== null && got.posts.some((x) => x.id === p.id), "getPlaylist memuat post terbit");

  await db.update(playlist).set({ visibility: "PRIVATE" }).where(eq(playlist.id, pl.id));
  assert((await getPlaylist(pl.id, admin.id)) === null, "playlist privat tak terlihat non-pemilik");
  assert(
    (await getPlaylist(pl.id, member.id)) !== null,
    "pemilik tetap bisa lihat playlist privat",
  );

  const del = await deletePlaylist(memberActor, pl.id);
  assert("ok" in del, "pemilik bisa hapus playlist");
  assert(
    !(await db.query.playlist.findFirst({ where: eq(playlist.id, pl.id) })),
    "playlist terhapus",
  );

  await db.delete(post).where(eq(post.id, p.id));

  assert(computeDiscount({ type: "PERCENT", value: 10 }, 100000) === 10000, "diskon persen");
  assert(computeDiscount({ type: "FIXED", value: 30000 }, 100000) === 30000, "diskon nominal");
  assert(
    computeDiscount({ type: "FIXED", value: 999999 }, 100000) === 100000,
    "diskon di-cap ke total",
  );

  await deleteCoupon(adminActor, "CEK50");
  await deleteCoupon(adminActor, "CEKFREE");
  const c1 = await createCoupon(adminActor, {
    code: "CEK50",
    type: "PERCENT",
    value: 50,
  });
  assert("ok" in c1, "admin buat kupon");
  const cBad = await createCoupon(memberActor, {
    code: "XX9",
    type: "PERCENT",
    value: 50,
  });
  assert("error" in cBad, "member tak bisa buat kupon");
  const v1 = await validateCoupon("cek50", 200000);
  assert(
    "discount" in v1 && v1.discount === 100000 && v1.finalAmount === 100000,
    "validasi kupon 50%",
  );

  await createCoupon(adminActor, {
    code: "CEKFREE",
    type: "PERCENT",
    value: 100,
  });
  const paidProdId = genId();
  await db.insert(product).values({
    id: paidProdId,
    ownerId: admin.id,
    title: "CEK Kupon Produk",
    slug: `cek-kupon-${paidProdId}`,
    kind: "SOURCE_CODE",
    status: "PUBLISHED",
    price: 80000,
  });
  const usesBefore = (await db.query.coupon.findFirst({
    where: eq(coupon.code, "CEKFREE"),
  }))!.uses;
  const ord = await createOrder(
    { id: member.id, name: member.name, email: member.email },
    paidProdId,
    "CEKFREE",
  );
  assert("orderId" in ord && ord.token === null, "kupon 100% -> order gratis tanpa Snap");
  assert(await hasEntitlement(member.id, paidProdId), "entitlement diberikan via kupon gratis");
  const usesAfter = (await db.query.coupon.findFirst({
    where: eq(coupon.code, "CEKFREE"),
  }))!.uses;
  assert(usesAfter === usesBefore + 1, "pemakaian kupon tercatat");

  assert(
    JSON.stringify(parseRepo("vercel/next.js")) ===
      JSON.stringify({ owner: "vercel", repo: "next.js" }),
    "parse owner/repo",
  );
  assert(
    JSON.stringify(parseRepo("https://github.com/facebook/react")) ===
      JSON.stringify({ owner: "facebook", repo: "react" }),
    "parse URL github",
  );
  assert(parseRepo("bukan-repo") === null, "tolak input tak valid");

  await deleteCoupon(adminActor, "CEK50");
  await deleteCoupon(adminActor, "CEKFREE");
  await db.delete(product).where(eq(product.id, paidProdId));

  console.log("check-backlog: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
