import { and, count, desc, eq, inArray } from "drizzle-orm";
import { bookmark, comment, commentLike, follow, like, post, postView } from "@/db/schema";
import { db } from "./db";
import { genId } from "./id";
import { notify } from "./notifications";
import type { Actor } from "./session";

const MAX_COMMENT = 2000;

export async function addComment(
  actor: Actor,
  postId: string,
  body: string,
  parentId?: string,
): Promise<{ id: string } | { error: string }> {
  const text = body.trim();
  if (!text) return { error: "Komentar tidak boleh kosong." };
  if (text.length > MAX_COMMENT) return { error: "Komentar terlalu panjang." };

  const p = await db.query.post.findFirst({ where: eq(post.id, postId) });
  if (!p || p.status !== "PUBLISHED") return { error: "Konten tidak ditemukan." };

  let parent: typeof comment.$inferSelect | undefined;
  if (parentId) {
    parent = await db.query.comment.findFirst({
      where: eq(comment.id, parentId),
    });
    if (!parent || parent.postId !== postId) return { error: "Balasan tidak valid." };
    if (parent.parentId) return { error: "Balasan hanya satu tingkat." };
  }

  const id = genId();
  await db.insert(comment).values({
    id,
    postId,
    authorId: actor.id,
    parentId: parentId ?? null,
    body: text,
  });

  const notified = new Set<string>([actor.id]);
  if (parent && !notified.has(parent.authorId)) {
    await notify({
      userId: parent.authorId,
      type: "REPLY",
      actorId: actor.id,
      postId,
      commentId: id,
    });
    notified.add(parent.authorId);
  }
  if (!notified.has(p.authorId)) {
    await notify({
      userId: p.authorId,
      type: "COMMENT",
      actorId: actor.id,
      postId,
      commentId: id,
    });
  }

  return { id };
}

export async function deleteComment(
  actor: Actor,
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const c = await db.query.comment.findFirst({ where: eq(comment.id, id) });
  if (!c) return { error: "Komentar tidak ditemukan." };
  if (c.authorId !== actor.id && actor.role !== "admin")
    return { error: "Anda tidak berhak menghapus komentar ini." };
  await db.delete(comment).where(eq(comment.id, id));
  return { ok: true };
}

export async function toggleCommentLike(
  actor: Actor,
  commentId: string,
): Promise<{ liked: boolean; count: number }> {
  const existing = await db.query.commentLike.findFirst({
    where: (t, { and, eq }) => and(eq(t.commentId, commentId), eq(t.userId, actor.id)),
  });
  if (existing)
    await db
      .delete(commentLike)
      .where(and(eq(commentLike.commentId, commentId), eq(commentLike.userId, actor.id)));
  else await db.insert(commentLike).values({ commentId, userId: actor.id }).onConflictDoNothing();

  const [row] = await db
    .select({ n: count() })
    .from(commentLike)
    .where(eq(commentLike.commentId, commentId));
  return { liked: !existing, count: row.n };
}

export async function toggleReaction(
  actor: Actor,
  postId: string,
  value: 1 | -1,
): Promise<{ likeCount: number; reaction: 1 | -1 | null }> {
  const existing = await db.query.like.findFirst({
    where: (t, { and, eq }) => and(eq(t.postId, postId), eq(t.userId, actor.id)),
  });

  let reaction: 1 | -1 | null;
  if (!existing) {
    await db.insert(like).values({ postId, userId: actor.id, value }).onConflictDoNothing();
    reaction = value;
  } else if (existing.value === value) {
    await db.delete(like).where(and(eq(like.postId, postId), eq(like.userId, actor.id)));
    reaction = null;
  } else {
    await db
      .update(like)
      .set({ value })
      .where(and(eq(like.postId, postId), eq(like.userId, actor.id)));
    reaction = value;
  }

  const [row] = await db
    .select({ n: count() })
    .from(like)
    .where(and(eq(like.postId, postId), eq(like.value, 1)));
  await db.update(post).set({ likeCount: row.n }).where(eq(post.id, postId));

  if (reaction === 1) {
    const p = await db.query.post.findFirst({
      where: eq(post.id, postId),
      columns: { authorId: true },
    });
    if (p) await notify({ userId: p.authorId, type: "LIKE", actorId: actor.id, postId });
  }
  return { likeCount: row.n, reaction };
}

export async function toggleLike(
  actor: Actor,
  postId: string,
): Promise<{ liked: boolean; count: number }> {
  const { likeCount, reaction } = await toggleReaction(actor, postId, 1);
  return { liked: reaction === 1, count: likeCount };
}

export async function toggleFollow(
  actor: Actor,
  targetUserId: string,
): Promise<{ following: boolean; count: number } | { error: string }> {
  if (targetUserId === actor.id) return { error: "Tidak bisa mengikuti diri sendiri." };
  const existing = await db.query.follow.findFirst({
    where: (t, { and, eq }) => and(eq(t.followerId, actor.id), eq(t.followingId, targetUserId)),
  });
  if (existing)
    await db
      .delete(follow)
      .where(and(eq(follow.followerId, actor.id), eq(follow.followingId, targetUserId)));
  else {
    await db
      .insert(follow)
      .values({ followerId: actor.id, followingId: targetUserId })
      .onConflictDoNothing();
    await notify({ userId: targetUserId, type: "FOLLOW", actorId: actor.id });
  }

  const [row] = await db
    .select({ n: count() })
    .from(follow)
    .where(eq(follow.followingId, targetUserId));
  return { following: !existing, count: row.n };
}

export async function followerCount(userId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(follow).where(eq(follow.followingId, userId));
  return row.n;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const row = await db.query.follow.findFirst({
    where: (t, { and, eq }) => and(eq(t.followerId, followerId), eq(t.followingId, followingId)),
  });
  return !!row;
}

export async function postLikeState(
  postId: string,
  viewerId?: string,
): Promise<{ likeCount: number; reaction: 1 | -1 | null }> {
  const [row] = await db
    .select({ n: count() })
    .from(like)
    .where(and(eq(like.postId, postId), eq(like.value, 1)));
  let reaction: 1 | -1 | null = null;
  if (viewerId) {
    const mine = await db.query.like.findFirst({
      where: (t, { and, eq }) => and(eq(t.postId, postId), eq(t.userId, viewerId)),
    });
    reaction = mine ? ((mine.value as 1 | -1) ?? null) : null;
  }
  return { likeCount: row.n, reaction };
}

export type CommentReply = {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    role: string | null;
    verified: boolean;
  };
  likeCount: number;
  likedByMe: boolean;
};
export type CommentNode = CommentReply & { replies: CommentReply[] };

export async function listComments(postId: string, viewerId?: string): Promise<CommentNode[]> {
  const rows = await db.query.comment.findMany({
    where: (t, { eq }) => eq(t.postId, postId),
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          username: true,
          image: true,
          role: true,
          verified: true,
        },
      },
    },
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  });
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const counts = await db
    .select({ commentId: commentLike.commentId, n: count() })
    .from(commentLike)
    .where(inArray(commentLike.commentId, ids))
    .groupBy(commentLike.commentId);
  const countMap = new Map(counts.map((c) => [c.commentId, c.n]));

  let liked = new Set<string>();
  if (viewerId) {
    const mine = await db
      .select({ commentId: commentLike.commentId })
      .from(commentLike)
      .where(and(eq(commentLike.userId, viewerId), inArray(commentLike.commentId, ids)));
    liked = new Set(mine.map((m) => m.commentId));
  }

  const decorate = (r: (typeof rows)[number]): CommentReply => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    author: r.author,
    likeCount: countMap.get(r.id) ?? 0,
    likedByMe: liked.has(r.id),
  });

  const byParent = new Map<string, CommentReply[]>();
  for (const r of rows)
    if (r.parentId) {
      const arr = byParent.get(r.parentId) ?? [];
      arr.push(decorate(r));
      byParent.set(r.parentId, arr);
    }

  return rows
    .filter((r) => !r.parentId)
    .map((r) => ({ ...decorate(r), replies: byParent.get(r.id) ?? [] }));
}

export async function subscriptionFeed(viewerId: string) {
  const following = await db
    .select({ id: follow.followingId })
    .from(follow)
    .where(eq(follow.followerId, viewerId));
  if (following.length === 0) return [];
  const ids = following.map((f) => f.id);
  return db.query.post.findMany({
    where: (p, { and, eq, inArray }) => and(eq(p.status, "PUBLISHED"), inArray(p.authorId, ids)),
    with: { author: true },
    orderBy: (p, { desc }) => [desc(p.publishedAt)],
    limit: 60,
  });
}

async function orderedPosts(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.query.post.findMany({
    where: (p, { and, eq, inArray }) => and(eq(p.status, "PUBLISHED"), inArray(p.id, ids)),
    with: { author: true },
  });
  const map = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter((p): p is (typeof rows)[number] => Boolean(p));
}

export async function isBookmarked(userId: string, postId: string): Promise<boolean> {
  const row = await db.query.bookmark.findFirst({
    where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.postId, postId)),
  });
  return !!row;
}

export async function toggleBookmark(actor: Actor, postId: string): Promise<{ saved: boolean }> {
  const existing = await isBookmarked(actor.id, postId);
  if (existing)
    await db
      .delete(bookmark)
      .where(and(eq(bookmark.userId, actor.id), eq(bookmark.postId, postId)));
  else await db.insert(bookmark).values({ userId: actor.id, postId }).onConflictDoNothing();
  return { saved: !existing };
}

export async function recordView(userId: string, postId: string): Promise<void> {
  await db
    .insert(postView)
    .values({ userId, postId })
    .onConflictDoUpdate({
      target: [postView.userId, postView.postId],
      set: { viewedAt: new Date() },
    });
}

export async function likedFeed(userId: string) {
  const rows = await db
    .select({ postId: like.postId })
    .from(like)
    .where(eq(like.userId, userId))
    .orderBy(desc(like.createdAt))
    .limit(120);
  return orderedPosts(rows.map((r) => r.postId));
}

export async function bookmarkFeed(userId: string) {
  const rows = await db
    .select({ postId: bookmark.postId })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))
    .orderBy(desc(bookmark.createdAt))
    .limit(120);
  return orderedPosts(rows.map((r) => r.postId));
}

export async function historyFeed(userId: string) {
  const rows = await db
    .select({ postId: postView.postId })
    .from(postView)
    .where(eq(postView.userId, userId))
    .orderBy(desc(postView.viewedAt))
    .limit(120);
  return orderedPosts(rows.map((r) => r.postId));
}
