"use server";

import type { RatingSummary } from "@/lib/ratings";
import { ratePost } from "@/lib/ratings";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n";

export async function rateAction(
  postId: string,
  stars: number,
): Promise<{ ok: true; summary: RatingSummary } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: (await getT())("msg.signInToRate") };
  return ratePost(session.user.id, postId, stars);
}
