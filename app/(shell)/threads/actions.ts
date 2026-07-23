"use server";

import { headers } from "next/headers";
import { anonHandle, anonId } from "@/lib/anon";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import type { OgCardData } from "@/components/og/OgCard";
import {
  applyVote,
  getTopicBySlug,
  insertThreadComment,
  insertThreadPost,
  threadPlainText,
} from "@/lib/threads";

type ThreadPoll = { options: string[]; endsAt: string | null };

function cleanColor(v: string | undefined | null): string | null {
  return v && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null;
}

function cleanUrl(v: string | undefined | null): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function cleanPoll(p: ThreadPoll | undefined | null): ThreadPoll | null {
  if (!p) return null;
  const options = p.options
    .map((o) => o.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (options.length < 2) return null;
  const endsAt = p.endsAt && !Number.isNaN(new Date(p.endsAt).getTime()) ? p.endsAt : null;
  return { options, endsAt };
}

function cleanOg(c: OgCardData | undefined | null): OgCardData | null {
  if (!c) return null;
  const url = cleanUrl(c.url);
  if (!url) return null;
  return {
    url,
    title: c.title ?? null,
    description: c.description ?? null,
    image: cleanUrl(c.image),
    siteName: c.siteName ?? null,
  };
}

type Ok<T> = { ok: true } & T;
type Err = { error: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const s = await getSettings();
  if (!s.integrations.turnstile.enabled) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: s.integrations.turnstile.secretKey,
        response: token,
        remoteip: ip,
      }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function anonRateOk(ip: string): Promise<boolean> {
  try {
    const key = `thread:anon:${ip}`;
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, 60);
    return n <= 5;
  } catch {
    return true;
  }
}

function sanitizeName(name: string | undefined): string {
  const v = (name ?? "").trim().slice(0, 40);
  return v || "Anonim";
}

export async function createThreadPostAction(input: {
  topicSlug: string;
  body: string;
  mediaUrls: string[];
  audioUrl?: string | null;
  color?: string | null;
  location?: string | null;
  ghost?: boolean;
  poll?: ThreadPoll | null;
  ogCard?: OgCardData | null;
  addToThread?: string;
  anonName?: string;
  turnstileToken?: string;
}): Promise<Ok<{ id: string }> | Err> {
  const body = input.body.trim();
  const mediaUrls = (input.mediaUrls ?? [])
    .map((u) => cleanUrl(u))
    .filter((u): u is string => u !== null)
    .slice(0, 8);
  const poll = cleanPoll(input.poll);
  const plain = threadPlainText(body);

  if (!plain && mediaUrls.length === 0 && !poll) return { error: "thread.err.body" };

  const topic = await getTopicBySlug(input.topicSlug);
  if (!topic) return { error: "thread.err.topic" };

  const session = await getSession();
  let authorId: string | null = null;
  let authorName: string;
  let anon: string | null = null;

  if (session) {
    authorId = session.user.id;
    authorName = session.user.name;
  } else {
    const ip = await clientIp();
    if (!(await verifyTurnstile(input.turnstileToken, ip)))
      return { error: "thread.err.turnstile" };
    if (!(await anonRateOk(ip))) return { error: "thread.err.rate" };
    anon = anonId(ip);
    authorName = input.anonName ? sanitizeName(input.anonName) : anonHandle(anon);
  }

  const title = (plain || mediaUrls[0] || topic.name).slice(0, 120);

  const id = await insertThreadPost({
    topicId: topic.id,
    authorId,
    authorName,
    anonId: anon,
    ghost: Boolean(input.ghost),
    title,
    body: body || null,
    mediaUrls,
    audioUrl: cleanUrl(input.audioUrl),
    color: cleanColor(input.color),
    location: input.location?.trim().slice(0, 80) || null,
    poll,
    ogCard: cleanOg(input.ogCard),
  });

  const extra = input.addToThread?.trim();
  if (extra) {
    await insertThreadComment({
      postId: id,
      parentId: null,
      authorId,
      authorName,
      anonId: anon,
      body: extra.slice(0, 4000),
    });
  }

  return { ok: true, id };
}

export async function createThreadCommentAction(input: {
  postId: string;
  parentId: string | null;
  body: string;
  anonName?: string;
  turnstileToken?: string;
}): Promise<Ok<{ id: string }> | Err> {
  const body = input.body.trim();
  if (!body) return { error: "thread.err.body" };

  const session = await getSession();
  let authorId: string | null = null;
  let authorName: string;
  let anon: string | null = null;

  if (session) {
    authorId = session.user.id;
    authorName = session.user.name;
  } else {
    const ip = await clientIp();
    if (!(await verifyTurnstile(input.turnstileToken, ip)))
      return { error: "thread.err.turnstile" };
    if (!(await anonRateOk(ip))) return { error: "thread.err.rate" };
    anon = anonId(ip);
    authorName = input.anonName ? sanitizeName(input.anonName) : anonHandle(anon);
  }

  const id = await insertThreadComment({
    postId: input.postId,
    parentId: input.parentId,
    authorId,
    authorName,
    anonId: anon,
    body,
  });
  return { ok: true, id };
}

export async function voteThreadAction(
  targetType: "post" | "comment",
  targetId: string,
  value: 1 | -1,
): Promise<Ok<{ score: number }> | Err> {
  const session = await getSession();
  if (!session) return { error: "thread.err.login" };
  const score = await applyVote(session.user.id, targetType, targetId, value);
  return { ok: true, score };
}
