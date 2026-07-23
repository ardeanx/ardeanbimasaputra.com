import { eq, sql } from "drizzle-orm";
import { post, viewEvent } from "@/db/schema";
import { db } from "./db";
import { redis } from "./redis";

export async function registerView(postId: string, viewer: string): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `view:${postId}:${viewer}:${day}`;
  let fresh = true;
  let redisOk = false;
  try {
    const res = await redis.set(key, "1", "EX", 86400, "NX");
    fresh = res === "OK";
    redisOk = true;
  } catch {
    fresh = true;
  }
  if (!fresh) return false;
  await db
    .update(post)
    .set({ viewCount: sql`${post.viewCount} + 1` })
    .where(eq(post.id, postId));
  if (redisOk) await db.insert(viewEvent).values({ postId });
  return true;
}
