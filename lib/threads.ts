import { and, desc, eq, sql } from "drizzle-orm";
import type { OgCardData } from "@/components/og/OgCard";
import { threadComment, threadPost, threadTopic, threadVote, user } from "@/db/schema";
import { db } from "./db";
import { genId } from "./id";
import { myPollVote, pollCounts } from "./thread-poll";

export type ThreadPoll = { options: string[]; endsAt: string | null };

export type ThreadAuthor = {
  id: string | null;
  name: string;
  image: string | null;
  verified: boolean;
};

export type ThreadPostRow = {
  id: string;
  topic: { slug: string; name: string } | null;
  author: ThreadAuthor;
  ghost: boolean;
  title: string;
  body: string | null;
  mediaUrls: string[];
  audioUrl: string | null;
  color: string | null;
  location: string | null;
  poll: ThreadPoll | null;
  pollCounts: number[];
  pollMyVote: number | null;
  ogCard: OgCardData | null;
  score: number;
  commentCount: number;
  removed: boolean;
  createdAt: string;
  myVote: number;
};

export type ThreadCommentRow = {
  id: string;
  postId: string;
  parentId: string | null;
  author: ThreadAuthor;
  body: string;
  score: number;
  removed: boolean;
  createdAt: string;
  myVote: number;
};

export { anonHandle } from "./anon";

export function threadPlainText(body: string): string {
  if (!body) return "";
  try {
    const doc = JSON.parse(body) as { type?: string };
    if (!doc || typeof doc !== "object" || doc.type !== "doc") return body.trim();
    const out: string[] = [];
    const walk = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      const n = node as { text?: string; content?: unknown[] };
      if (typeof n.text === "string") out.push(n.text);
      for (const c of n.content ?? []) walk(c);
    };
    walk(doc);
    return out.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return body.trim();
  }
}

function author(
  authorId: string | null,
  authorName: string,
  userName: string | null,
  userImage: string | null,
  userVerified: boolean | null,
): ThreadAuthor {
  if (authorId) {
    return {
      id: authorId,
      name: userName ?? authorName,
      image: userImage,
      verified: userVerified ?? false,
    };
  }
  return { id: null, name: authorName, image: null, verified: false };
}

export async function listTopics() {
  return db
    .select({
      id: threadTopic.id,
      slug: threadTopic.slug,
      name: threadTopic.name,
      description: threadTopic.description,
      color: threadTopic.color,
      postCount: threadTopic.postCount,
    })
    .from(threadTopic)
    .orderBy(desc(threadTopic.postCount));
}

export async function getTopicBySlug(slug: string) {
  const [row] = await db.select().from(threadTopic).where(eq(threadTopic.slug, slug)).limit(1);
  return row ?? null;
}

function postSelect(viewerId: string | null | undefined) {
  const vid = viewerId ?? "";
  return {
    id: threadPost.id,
    topicSlug: threadTopic.slug,
    topicName: threadTopic.name,
    authorId: threadPost.authorId,
    authorName: threadPost.authorName,
    userName: user.name,
    userImage: user.image,
    userVerified: user.verified,
    ghost: threadPost.ghost,
    title: threadPost.title,
    body: threadPost.body,
    mediaUrls: threadPost.mediaUrls,
    audioUrl: threadPost.audioUrl,
    color: threadPost.color,
    location: threadPost.location,
    poll: threadPost.poll,
    ogCard: threadPost.ogCard,
    score: threadPost.score,
    commentCount: threadPost.commentCount,
    removed: threadPost.removed,
    createdAt: threadPost.createdAt,
    myVote: sql<number>`coalesce((select ${threadVote.value} from ${threadVote} where ${threadVote.userId} = ${vid} and ${threadVote.targetType} = 'post' and ${threadVote.targetId} = ${threadPost.id}), 0)`,
  };
}

type PostSel = {
  id: string;
  topicSlug: string | null;
  topicName: string | null;
  authorId: string | null;
  authorName: string;
  userName: string | null;
  userImage: string | null;
  userVerified: boolean | null;
  ghost: boolean;
  title: string;
  body: string | null;
  mediaUrls: string[];
  audioUrl: string | null;
  color: string | null;
  location: string | null;
  poll: ThreadPoll | null;
  ogCard: OgCardData | null;
  score: number;
  commentCount: number;
  removed: boolean;
  createdAt: Date;
  myVote: number;
};

function mapPost(r: PostSel): ThreadPostRow {
  return {
    id: r.id,
    topic: r.topicSlug ? { slug: r.topicSlug, name: r.topicName ?? r.topicSlug } : null,
    author: author(r.authorId, r.authorName, r.userName, r.userImage, r.userVerified),
    ghost: r.ghost,
    title: r.title,
    body: r.body,
    mediaUrls: r.mediaUrls,
    audioUrl: r.audioUrl,
    color: r.color,
    location: r.location,
    poll: r.poll,
    pollCounts: [],
    pollMyVote: null,
    ogCard: r.ogCard,
    score: r.score,
    commentCount: r.commentCount,
    removed: r.removed,
    createdAt: r.createdAt.toISOString(),
    myVote: Number(r.myVote),
  };
}

async function attachPoll(
  row: ThreadPostRow,
  viewerId: string | null | undefined,
): Promise<ThreadPostRow> {
  if (!row.poll) return row;
  const [counts, mine] = await Promise.all([
    pollCounts(row.id, row.poll.options.length),
    myPollVote(row.id, viewerId),
  ]);
  row.pollCounts = counts;
  row.pollMyVote = mine;
  return row;
}

export async function listThreadPosts(opts: {
  topicSlug?: string;
  sort?: "hot" | "new" | "top";
  limit?: number;
  viewerId?: string | null;
}): Promise<ThreadPostRow[]> {
  const sort = opts.sort ?? "hot";
  const conds = [eq(threadPost.removed, false)];
  if (opts.topicSlug) conds.push(eq(threadTopic.slug, opts.topicSlug));

  const order =
    sort === "new"
      ? desc(threadPost.createdAt)
      : sort === "top"
        ? desc(threadPost.score)
        : sql`${threadPost.score} - extract(epoch from now() - ${threadPost.createdAt}) / 43200 desc`;

  const rows = await db
    .select(postSelect(opts.viewerId))
    .from(threadPost)
    .leftJoin(threadTopic, eq(threadPost.topicId, threadTopic.id))
    .leftJoin(user, eq(threadPost.authorId, user.id))
    .where(and(...conds))
    .orderBy(order)
    .limit(opts.limit ?? 50);

  return Promise.all(rows.map((r) => attachPoll(mapPost(r), opts.viewerId)));
}

export async function getThreadPost(
  id: string,
  viewerId?: string | null,
): Promise<ThreadPostRow | null> {
  const [row] = await db
    .select(postSelect(viewerId))
    .from(threadPost)
    .leftJoin(threadTopic, eq(threadPost.topicId, threadTopic.id))
    .leftJoin(user, eq(threadPost.authorId, user.id))
    .where(eq(threadPost.id, id))
    .limit(1);
  return row ? attachPoll(mapPost(row), viewerId) : null;
}

export async function listThreadComments(
  postId: string,
  viewerId?: string | null,
): Promise<ThreadCommentRow[]> {
  const vid = viewerId ?? "";
  const rows = await db
    .select({
      id: threadComment.id,
      postId: threadComment.postId,
      parentId: threadComment.parentId,
      authorId: threadComment.authorId,
      authorName: threadComment.authorName,
      userName: user.name,
      userImage: user.image,
      userVerified: user.verified,
      body: threadComment.body,
      score: threadComment.score,
      removed: threadComment.removed,
      createdAt: threadComment.createdAt,
      myVote: sql<number>`coalesce((select ${threadVote.value} from ${threadVote} where ${threadVote.userId} = ${vid} and ${threadVote.targetType} = 'comment' and ${threadVote.targetId} = ${threadComment.id}), 0)`,
    })
    .from(threadComment)
    .leftJoin(user, eq(threadComment.authorId, user.id))
    .where(eq(threadComment.postId, postId))
    .orderBy(desc(threadComment.score), desc(threadComment.createdAt));

  return rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    parentId: r.parentId,
    author: author(r.authorId, r.authorName, r.userName, r.userImage, r.userVerified),
    body: r.body,
    score: r.score,
    removed: r.removed,
    createdAt: r.createdAt.toISOString(),
    myVote: Number(r.myVote),
  }));
}

export async function insertThreadPost(args: {
  topicId: string | null;
  authorId: string | null;
  authorName: string;
  anonId: string | null;
  ghost: boolean;
  title: string;
  body: string | null;
  mediaUrls: string[];
  audioUrl: string | null;
  color: string | null;
  location: string | null;
  poll: ThreadPoll | null;
  ogCard: OgCardData | null;
}): Promise<string> {
  const id = genId();
  await db.insert(threadPost).values({
    id,
    topicId: args.topicId,
    authorId: args.authorId,
    authorName: args.authorName,
    anonId: args.anonId,
    ghost: args.ghost,
    title: args.title,
    body: args.body,
    mediaUrls: args.mediaUrls,
    audioUrl: args.audioUrl,
    color: args.color,
    location: args.location,
    poll: args.poll,
    ogCard: args.ogCard
      ? {
          url: args.ogCard.url,
          title: args.ogCard.title ?? "",
          description: args.ogCard.description ?? "",
          image: args.ogCard.image ?? null,
          siteName: args.ogCard.siteName ?? null,
        }
      : null,
  });
  if (args.topicId) {
    await db
      .update(threadTopic)
      .set({ postCount: sql`${threadTopic.postCount} + 1` })
      .where(eq(threadTopic.id, args.topicId));
  }
  return id;
}

export async function insertThreadComment(args: {
  postId: string;
  parentId: string | null;
  authorId: string | null;
  authorName: string;
  anonId: string | null;
  body: string;
}): Promise<string> {
  const id = genId();
  await db.insert(threadComment).values({
    id,
    postId: args.postId,
    parentId: args.parentId,
    authorId: args.authorId,
    authorName: args.authorName,
    anonId: args.anonId,
    body: args.body,
  });
  await db
    .update(threadPost)
    .set({ commentCount: sql`${threadPost.commentCount} + 1` })
    .where(eq(threadPost.id, args.postId));
  return id;
}

export async function applyVote(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
  value: 1 | -1,
): Promise<number> {
  const target = targetType === "post" ? threadPost : threadComment;
  const [existing] = await db
    .select({ value: threadVote.value })
    .from(threadVote)
    .where(
      and(
        eq(threadVote.userId, userId),
        eq(threadVote.targetType, targetType),
        eq(threadVote.targetId, targetId),
      ),
    )
    .limit(1);

  let delta = 0;
  if (!existing) {
    await db.insert(threadVote).values({ userId, targetType, targetId, value });
    delta = value;
  } else if (existing.value === value) {
    await db
      .delete(threadVote)
      .where(
        and(
          eq(threadVote.userId, userId),
          eq(threadVote.targetType, targetType),
          eq(threadVote.targetId, targetId),
        ),
      );
    delta = -value;
  } else {
    await db
      .update(threadVote)
      .set({ value })
      .where(
        and(
          eq(threadVote.userId, userId),
          eq(threadVote.targetType, targetType),
          eq(threadVote.targetId, targetId),
        ),
      );
    delta = value - existing.value;
  }

  const [row] = await db
    .update(target)
    .set({ score: sql`${target.score} + ${delta}` })
    .where(eq(target.id, targetId))
    .returning({ score: target.score });
  return row?.score ?? 0;
}

export async function setThreadRemoved(
  targetType: "post" | "comment",
  id: string,
  removed: boolean,
): Promise<void> {
  const target = targetType === "post" ? threadPost : threadComment;
  await db.update(target).set({ removed }).where(eq(target.id, id));
}

export async function createThreadTopic(args: {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}): Promise<string> {
  const id = genId();
  await db.insert(threadTopic).values({
    id,
    name: args.name,
    slug: args.slug,
    description: args.description ?? null,
    color: args.color ?? null,
  });
  return id;
}
