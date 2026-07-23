"use server";

import { type } from "arktype";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { post } from "@/db/schema";
import { db } from "@/lib/db";
import { deletePost, moderatePost, savePost } from "@/lib/posts";
import { revalidateContent } from "@/lib/revalidate";
import { getSession, isAdminUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { postMeta, type PostMeta } from "@/lib/validators";

type SaveState =
  { error: string } | { ok: true; id: string; status: string; created: boolean; at: number } | null;

function parseBody(raw: string): unknown {
  try {
    const doc = JSON.parse(raw);
    if (doc && doc.type === "doc") return doc;
  } catch {}
  return { type: "doc", content: [] };
}

export async function savePostAction(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const session = await getSession();
  if (!session) return { error: (await getT())("msg.sessionExpired") };

  const categoryRaw = formData.get("categoryId");
  const thumbRaw = String(formData.get("thumbnail") ?? "").trim();
  const mediaRaw = String(formData.get("mediaUrl") ?? "").trim();
  const durationRaw = formData.get("durationSec");
  const repoRaw = String(formData.get("repoUrl") ?? "").trim();
  const excerptRaw = String(formData.get("excerpt") ?? "").trim();
  const visibilityRaw = String(formData.get("visibility") ?? "PUBLIC");

  const slugRaw = String(formData.get("slug") ?? "").trim();
  const seoTitleRaw = String(formData.get("seoTitle") ?? "").trim();
  const seoDescriptionRaw = String(formData.get("seoDescription") ?? "").trim();
  const ogImageRaw = String(formData.get("ogImage") ?? "").trim();
  const canonicalUrlRaw = String(formData.get("canonicalUrl") ?? "").trim();

  const parsed = postMeta({
    title: String(formData.get("title") ?? "").trim(),
    type: String(formData.get("type") ?? "POST"),
    categoryId: categoryRaw ? Number(categoryRaw) : null,
    thumbnail: thumbRaw || null,
    slug: slugRaw || null,
    excerpt: excerptRaw || null,
    mediaUrl: mediaRaw || null,
    durationSec: durationRaw ? Math.max(0, Math.trunc(Number(durationRaw))) : null,
    repoUrl: repoRaw || null,
    visibility: visibilityRaw as "PUBLIC" | "UNLISTED" | "PRIVATE",
    seoTitle: seoTitleRaw || null,
    seoDescription: seoDescriptionRaw || null,
    ogImage: ogImageRaw || null,
    canonicalUrl: canonicalUrlRaw || null,
    noindex: formData.get("noindex") === "1",
  });

  if (parsed instanceof type.errors) {
    return { error: parsed.summary };
  }

  const idRaw = formData.get("id");
  const res = await savePost(actorOf(session.user), {
    id: idRaw ? String(idRaw) : undefined,
    meta: parsed as PostMeta,
    body: parseBody(String(formData.get("body") ?? "")),
    publish: formData.get("intent") === "publish",
  });

  if ("error" in res) return { error: res.error };

  revalidateContent();
  return { ok: true, id: res.id, status: res.status, created: !idRaw, at: Date.now() };
}

export async function setViewCountAction(
  postId: string,
  count: number,
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: (await getT())("msg.sessionExpired") };
  if (!isAdminUser(session.user)) return { error: (await getT())("msg.accessDenied") };

  const value = Math.max(0, Math.trunc(Number(count)));
  if (!Number.isFinite(value)) return { error: (await getT())("msg.invalidValue") };

  await db.update(post).set({ viewCount: value }).where(eq(post.id, postId));
  revalidateContent();
  return { ok: true };
}

export async function deletePostAction(id: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await deletePost(actorOf(session.user), id);
  revalidateContent();
}

export async function moderateAction(id: string, decision: "approve" | "reject"): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await moderatePost(actorOf(session.user), id, decision);
  revalidatePath("/studio/moderation");
  revalidateContent();
}
