"use server";

import type { RatingSummary } from "@/lib/ratings";
import { ratePost } from "@/lib/ratings";
import { getSession } from "@/lib/session";

export async function rateAction(
  postId: string,
  stars: number,
): Promise<{ ok: true; summary: RatingSummary } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Masuk untuk memberi rating." };
  return ratePost(session.user.id, postId, stars);
}
