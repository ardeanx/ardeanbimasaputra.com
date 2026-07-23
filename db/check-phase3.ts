import assert from "node:assert";
import { and, count, eq } from "drizzle-orm";
import {
  addComment,
  deleteComment,
  listComments,
  subscriptionFeed,
  toggleFollow,
  toggleLike,
} from "../lib/community";
import { moderatePost, savePost } from "../lib/posts";
import { comment, follow, like, notification, user } from "./schema";
import { db } from "../lib/db";

const meta = {
  type: "POST" as const,
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

  const p = await savePost(adminActor, {
    meta: { ...meta, title: "CEK Fase 3 Komunitas" },
    body: { type: "doc", content: [] },
    publish: true,
  });
  assert("id" in p, "admin publish konten uji");
  const postId = p.id;

  const c = await addComment(memberActor, postId, "Komentar utama");
  assert("id" in c, "member bisa komentar");
  const rootId = c.id;

  const notifAuthor = await db.query.notification.findFirst({
    where: and(eq(notification.userId, admin.id), eq(notification.commentId, rootId)),
  });
  assert(notifAuthor?.type === "COMMENT", "notifikasi COMMENT ke penulis post");

  const r = await addComment(adminActor, postId, "Balasan", rootId);
  assert("id" in r, "reply satu tingkat diterima");
  const replyId = r.id;

  const notifReply = await db.query.notification.findFirst({
    where: and(eq(notification.userId, member.id), eq(notification.commentId, replyId)),
  });
  assert(notifReply?.type === "REPLY", "notifikasi REPLY ke penulis komentar");

  const nested = await addComment(memberActor, postId, "Balasan berlebih", replyId);
  assert("error" in nested, "balasan lebih dari satu tingkat ditolak");

  const tree = await listComments(postId, member.id);
  assert(tree.length === 1 && tree[0].replies.length === 1, "threaded satu tingkat");

  const badDel = await deleteComment(memberActor, replyId);
  assert("error" in badDel, "non-pemilik non-admin ditolak hapus");
  const okDel = await deleteComment(adminActor, replyId);
  assert("ok" in okDel, "pemilik/admin bisa hapus komentarnya");
  assert(
    !(await db.query.comment.findFirst({ where: eq(comment.id, replyId) })),
    "komentar terhapus",
  );

  const l1 = await toggleLike(memberActor, postId);
  assert(l1.liked && l1.count === 1, "like on -> count 1");
  const l2 = await toggleLike(memberActor, postId);
  assert(!l2.liked && l2.count === 0, "like off -> count 0 (idempoten)");
  await toggleLike(memberActor, postId);
  await toggleLike(memberActor, postId);
  const [{ n }] = await db.select({ n: count() }).from(like).where(eq(like.postId, postId));
  assert(n <= 1, "tidak ada duplikat like (PK gabungan)");

  const self = await toggleFollow(memberActor, member.id);
  assert("error" in self, "self-follow ditolak");

  const f1 = await toggleFollow(memberActor, admin.id);
  assert("following" in f1 && f1.following && f1.count === 1, "follow on");
  const followNotif = await db.query.notification.findFirst({
    where: and(eq(notification.userId, admin.id), eq(notification.type, "FOLLOW")),
  });
  assert(followNotif, "notifikasi FOLLOW ke target");

  const mrev = await savePost(memberActor, {
    meta: { ...meta, title: "CEK Review lalu Approve" },
    body: { type: "doc", content: [] },
    publish: true,
  });
  assert("id" in mrev, "member kirim ke review");
  await moderatePost(adminActor, mrev.id, "approve");
  const approvedNotif = await db.query.notification.findFirst({
    where: and(
      eq(notification.userId, member.id),
      eq(notification.type, "APPROVED"),
      eq(notification.postId, mrev.id),
    ),
  });
  assert(approvedNotif, "notifikasi APPROVED ke penulis saat disetujui");

  const feed = await subscriptionFeed(member.id);
  assert(
    feed.some((x) => x.authorId === admin.id),
    "feed subscription memuat konten kreator yang diikuti",
  );

  const f2 = await toggleFollow(memberActor, admin.id);
  assert("following" in f2 && !f2.following && f2.count === 0, "unfollow off");
  const emptyFeed = await subscriptionFeed(member.id);
  assert(emptyFeed.length === 0, "unfollow -> feed kosong");

  await deleteComment(memberActor, rootId);
  await db.delete(follow).where(eq(follow.followerId, member.id));
  await db.delete(like).where(eq(like.postId, postId));

  console.log("check-phase3: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
