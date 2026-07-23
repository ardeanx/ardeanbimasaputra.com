import { and, desc, eq, notInArray } from "drizzle-orm";
import { searchHistory } from "@/db/schema";
import { db } from "./db";

const MAX_ITEMS = 50;

export async function recordSearch(userId: string, raw: string): Promise<void> {
  const query = raw.trim().slice(0, 100);
  if (!query) return;
  await db
    .insert(searchHistory)
    .values({ userId, query, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [searchHistory.userId, searchHistory.query],
      set: { updatedAt: new Date() },
    });
  const keep = await db
    .select({ query: searchHistory.query })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.updatedAt))
    .limit(MAX_ITEMS);
  if (keep.length === MAX_ITEMS) {
    await db.delete(searchHistory).where(
      and(
        eq(searchHistory.userId, userId),
        notInArray(
          searchHistory.query,
          keep.map((k) => k.query),
        ),
      ),
    );
  }
}

export async function listSearchHistory(userId: string, limit = 10): Promise<string[]> {
  const rows = await db
    .select({ query: searchHistory.query })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.updatedAt))
    .limit(limit);
  return rows.map((r) => r.query);
}

export async function removeSearch(userId: string, query: string): Promise<void> {
  await db
    .delete(searchHistory)
    .where(and(eq(searchHistory.userId, userId), eq(searchHistory.query, query)));
}
