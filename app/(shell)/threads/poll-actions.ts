"use server";

import { eq } from "drizzle-orm";
import { threadPollVote, threadPost } from "@/db/schema";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { pollCounts } from "@/lib/thread-poll";

export async function voteThreadPollAction(
  postId: string,
  optionIndex: number,
): Promise<{ ok: true; counts: number[]; myVote: number } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "unauthorized" };
  const userId = session.user.id;

  const rows = await db
    .select({ poll: threadPost.poll })
    .from(threadPost)
    .where(eq(threadPost.id, postId))
    .limit(1);
  const poll = rows[0]?.poll;
  if (!poll) return { error: "not_found" };
  if (poll.endsAt && new Date(poll.endsAt).getTime() < Date.now()) {
    return { error: "closed" };
  }
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
    return { error: "invalid" };
  }

  await db
    .insert(threadPollVote)
    .values({ postId, userId, optionIndex })
    .onConflictDoUpdate({
      target: [threadPollVote.postId, threadPollVote.userId],
      set: { optionIndex },
    });

  const counts = await pollCounts(postId, poll.options.length);
  return { ok: true, counts, myVote: optionIndex };
}
