import { createPrivateKey, createSign } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { pushSubscription } from "@/db/schema";
import { db } from "./db";
import { genId } from "./id";
import { getSettings } from "./settings";

export type PushKeys = { p256dh: string; auth: string };

export async function saveSubscription(
  userId: string | null,
  sub: { endpoint: string; keys: PushKeys },
): Promise<void> {
  await db
    .insert(pushSubscription)
    .values({
      id: genId(),
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await db.delete(pushSubscription).where(eq(pushSubscription.endpoint, endpoint));
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function vapidAuthHeader(
  endpoint: string,
  publicKey: string,
  privateKey: string,
  subject: string,
): string {
  const aud = new URL(endpoint).origin;
  const header = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        aud,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: subject || "mailto:admin@localhost",
      }),
    ),
  );
  const pub = Buffer.from(publicKey, "base64url");
  const key = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: b64url(pub.subarray(1, 33)),
      y: b64url(pub.subarray(33, 65)),
      d: privateKey,
    },
    format: "jwk",
  });
  const signer = createSign("SHA256");
  signer.update(`${header}.${payload}`);
  const sig = signer.sign({ key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${header}.${payload}.${b64url(sig)}, k=${publicKey}`;
}

type SubRow = typeof pushSubscription.$inferSelect;

export async function sendPushTickle(subs: SubRow[]): Promise<number> {
  const s = (await getSettings()).integrations.push;
  if (!s.enabled || !s.vapidPublicKey || !s.vapidPrivateKey || subs.length === 0) return 0;
  const dead: string[] = [];
  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub) => {
      const auth = vapidAuthHeader(sub.endpoint, s.vapidPublicKey, s.vapidPrivateKey, s.subject);
      const res = await fetch(sub.endpoint, {
        method: "POST",
        headers: { TTL: "86400", Authorization: auth },
      });
      if (res.status === 404 || res.status === 410) dead.push(sub.endpoint);
      else if (res.ok) sent += 1;
    }),
  );
  if (dead.length > 0)
    await db.delete(pushSubscription).where(inArray(pushSubscription.endpoint, dead));
  return sent;
}

export async function sendPushToAll(): Promise<number> {
  const subs = await db.select().from(pushSubscription);
  return sendPushTickle(subs);
}

export async function sendPushToUsers(userIds: string[]): Promise<number> {
  if (userIds.length === 0) return 0;
  const subs = await db
    .select()
    .from(pushSubscription)
    .where(inArray(pushSubscription.userId, userIds));
  return sendPushTickle(subs);
}
