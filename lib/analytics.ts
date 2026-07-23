import { and, count, eq, gte, inArray, sql } from "drizzle-orm";
import { comment, follow, like, post, viewEvent } from "@/db/schema";
import { db } from "./db";

export type Analytics = {
  totalViews: number;
  subscribers: number;
  likes: number;
  comments: number;
  postCount: number;
  days: { day: string; n: number }[];
  top: {
    id: string;
    title: string;
    type: string;
    viewCount: number;
    thumbnail: string | null;
  }[];
};

export async function channelAnalytics(
  userId: string,
  isAdmin: boolean,
  now = Date.now(),
): Promise<Analytics> {
  const pubScope = isAdmin
    ? eq(post.status, "PUBLISHED")
    : and(eq(post.status, "PUBLISHED"), eq(post.authorId, userId));

  const myPosts = await db
    .select({
      id: post.id,
      title: post.title,
      type: post.type,
      viewCount: post.viewCount,
      thumbnail: post.thumbnail,
    })
    .from(post)
    .where(pubScope);
  const ids = myPosts.map((p) => p.id);

  const totalViews = myPosts.reduce((s, p) => s + p.viewCount, 0);
  const subscribers = await db.$count(follow, eq(follow.followingId, userId));

  const [likes, comments, daily] = ids.length
    ? await Promise.all([
        db
          .select({ n: count() })
          .from(like)
          .where(inArray(like.postId, ids))
          .then((r) => r[0]?.n ?? 0),
        db
          .select({ n: count() })
          .from(comment)
          .where(inArray(comment.postId, ids))
          .then((r) => r[0]?.n ?? 0),
        db
          .select({
            day: sql<string>`to_char(date_trunc('day', ${viewEvent.createdAt}), 'YYYY-MM-DD')`,
            n: count(),
          })
          .from(viewEvent)
          .where(
            and(
              inArray(viewEvent.postId, ids),
              gte(viewEvent.createdAt, new Date(now - 28 * 24 * 3600 * 1000)),
            ),
          )
          .groupBy(sql`date_trunc('day', ${viewEvent.createdAt})`),
      ])
    : [0, 0, [] as { day: string; n: number }[]];

  const map = new Map(daily.map((d) => [d.day, d.n]));
  const days = Array.from({ length: 28 }, (_, i) => {
    const day = new Date(now - (27 - i) * 24 * 3600 * 1000).toISOString().slice(0, 10);
    return { day, n: map.get(day) ?? 0 };
  });

  const top = [...myPosts].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);

  return {
    totalViews,
    subscribers,
    likes,
    comments,
    postCount: myPosts.length,
    days,
    top,
  };
}
