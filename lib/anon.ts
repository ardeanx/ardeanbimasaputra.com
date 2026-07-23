import { createHash } from "node:crypto";

export function anonHandle(seed: string): string {
  const h = createHash("sha256").update(seed).digest("hex").slice(0, 4).toUpperCase();
  return `Anon-${h}`;
}

export function anonId(ip: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}:${day}`).digest("hex").slice(0, 16);
}
