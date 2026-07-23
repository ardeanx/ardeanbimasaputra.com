import { threadPollVote } from "@/db/schema";
import { db } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";

export async function pollCounts(postId: string, optionCount: number): Promise<number[]> {
  const rows = await db
    .select({
      optionIndex: threadPollVote.optionIndex,
      n: sql<number>`count(*)::int`,
    })
    .from(threadPollVote)
    .where(eq(threadPollVote.postId, postId))
    .groupBy(threadPollVote.optionIndex);
  const counts = Array.from({ length: Math.max(0, optionCount) }, () => 0);
  for (const r of rows) {
    if (r.optionIndex >= 0 && r.optionIndex < counts.length) {
      counts[r.optionIndex] = Number(r.n);
    }
  }
  return counts;
}

export async function myPollVote(
  postId: string,
  userId: string | null | undefined,
): Promise<number | null> {
  if (!userId) return null;
  const rows = await db
    .select({ optionIndex: threadPollVote.optionIndex })
    .from(threadPollVote)
    .where(and(eq(threadPollVote.postId, postId), eq(threadPollVote.userId, userId)))
    .limit(1);
  return rows[0]?.optionIndex ?? null;
}
