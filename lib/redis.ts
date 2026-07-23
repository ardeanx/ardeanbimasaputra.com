import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis = (globalForRedis.redis ??= new Redis(
  process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  },
));

redis.on("error", () => {});

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {}
}
