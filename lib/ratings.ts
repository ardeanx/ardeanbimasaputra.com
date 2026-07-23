import { and, avg, count, eq } from "drizzle-orm";
import { post, rating } from "@/db/schema";
import { db } from "./db";

export type RatingSummary = { avg: number; count: number };

export async function getRatingSummary(postId: string): Promise<RatingSummary> {
  const [row] = await db
    .select({ avg: avg(rating.stars), count: count() })
    .from(rating)
    .where(eq(rating.postId, postId));
  return { avg: row?.avg ? Number(row.avg) : 0, count: row?.count ?? 0 };
}

export async function getUserRating(postId: string, userId: string): Promise<number | null> {
  const row = await db.query.rating.findFirst({
    where: and(eq(rating.postId, postId), eq(rating.userId, userId)),
  });
  return row?.stars ?? null;
}

export async function ratePost(
  userId: string,
  postId: string,
  stars: number,
): Promise<{ ok: true; summary: RatingSummary } | { error: string }> {
  if (!Number.isInteger(stars) || stars < 0 || stars > 5) {
    return { error: "Nilai rating tidak valid." };
  }
  const target = await db.query.post.findFirst({ where: eq(post.id, postId) });
  if (!target || target.status !== "PUBLISHED") {
    return { error: "Konten tidak ditemukan." };
  }
  if (stars === 0) {
    await db.delete(rating).where(and(eq(rating.postId, postId), eq(rating.userId, userId)));
  } else {
    await db
      .insert(rating)
      .values({ postId, userId, stars, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [rating.postId, rating.userId],
        set: { stars, updatedAt: new Date() },
      });
  }
  return { ok: true, summary: await getRatingSummary(postId) };
}
