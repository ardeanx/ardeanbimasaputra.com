import assert from "node:assert";
import { and, eq } from "drizzle-orm";
import { channelAnalytics } from "../lib/analytics";
import { addComment, toggleLike } from "../lib/community";
import { db } from "../lib/db";
import { savePost } from "../lib/posts";
import { follow, post, user, viewEvent } from "./schema";

async function main() {
  const admin = (await db.query.user.findFirst({
    where: eq(user.username, "ardean"),
  }))!;
  const member = (await db.query.user.findFirst({
    where: eq(user.username, "sintadev"),
  }))!;
  assert(admin && member, "seed user ada");

  await db
    .delete(follow)
    .where(and(eq(follow.followerId, member.id), eq(follow.followingId, admin.id)));
  await db.delete(post).where(and(eq(post.authorId, admin.id), eq(post.title, "CEK Analitik")));

  const p = await savePost(
    { id: admin.id, role: "admin" },
    {
      meta: {
        type: "POST" as const,
        categoryId: null,
        thumbnail: null,
        title: "CEK Analitik",
      },
      body: { type: "doc", content: [] },
      publish: true,
    },
  );
  assert("id" in p, "post uji dibuat");

  await db.update(post).set({ viewCount: 9_999_999 }).where(eq(post.id, p.id));
  await db.insert(viewEvent).values([{ postId: p.id }, { postId: p.id }, { postId: p.id }]);
  await toggleLike({ id: member.id, role: "member" }, p.id);
  await addComment({ id: member.id, role: "member" }, p.id, "komentar analitik");
  await db
    .insert(follow)
    .values({ followerId: member.id, followingId: admin.id })
    .onConflictDoNothing();

  const a = await channelAnalytics(admin.id, true, Date.now());
  assert(a.totalViews >= 9_999_999, "totalViews memuat post uji");
  assert(a.subscribers >= 1, "subscriber terhitung");
  assert(a.likes >= 1, "likes terhitung");
  assert(a.comments >= 1, "comments terhitung");
  assert(a.days.reduce((s, d) => s + d.n, 0) >= 3, "view event harian terhitung >= 3");
  assert(
    a.top.some((t) => t.id === p.id),
    "post uji ada di konten teratas",
  );

  await db
    .delete(follow)
    .where(and(eq(follow.followerId, member.id), eq(follow.followingId, admin.id)));
  await db.delete(post).where(eq(post.id, p.id));

  console.log("check-phase6: SEMUA ASSERT LOLOS ✔");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
