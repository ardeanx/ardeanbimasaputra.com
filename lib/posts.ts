import { eq } from "drizzle-orm";
import { post } from "@/db/schema";
import { db } from "./db";
import { genId } from "./id";
import { fanoutNewContent, notify } from "./notifications";
import type { Actor } from "./session";
import { getSettings } from "./settings";
import type { PostMeta } from "./validators";

const EMPTY_DOC = { type: "doc", content: [] };

export function normalizeDoc(body: unknown): unknown {
  if (body && typeof body === "object" && (body as { type?: string }).type === "doc") {
    return body;
  }
  return EMPTY_DOC;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired) || "untitled";
  const clash = await db.query.post.findFirst({ where: eq(post.slug, base) });
  if (!clash || clash.id === excludeId) return base;
  return `${base}-${genId().slice(0, 5)}`;
}

function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err.code === "23505" || err.cause?.code === "23505";
}

export async function savePost(
  actor: Actor,
  args: { id?: string; meta: PostMeta; body: unknown; publish: boolean },
): Promise<{ id: string; status: string } | { error: string }> {
  const { id, meta, publish } = args;
  const body = normalizeDoc(args.body);
  const settings = await getSettings();
  const status = publish
    ? actor.role === "admin" || !settings.system.requireReview
      ? "PUBLISHED"
      : "REVIEW"
    : "DRAFT";

  if (id) {
    const existing = await db.query.post.findFirst({ where: eq(post.id, id) });
    if (!existing) return { error: "Konten tidak ditemukan." };
    if (existing.authorId !== actor.id && actor.role !== "admin") {
      return { error: "Anda tidak berhak mengubah konten ini." };
    }
    let nextSlug =
      meta.slug && slugify(meta.slug) && slugify(meta.slug) !== existing.slug
        ? await uniqueSlug(meta.slug, id)
        : existing.slug;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await db
          .update(post)
          .set({
            title: meta.title,
            slug: nextSlug,
            type: meta.type,
            categoryId: meta.categoryId ?? null,
            thumbnail: meta.thumbnail ?? null,
            excerpt: meta.excerpt ?? null,
            mediaUrl: meta.mediaUrl ?? null,
            durationSec: meta.durationSec ?? null,
            repoUrl: meta.repoUrl ?? null,
            visibility: meta.visibility ?? "PUBLIC",
            seoTitle: meta.seoTitle ?? null,
            seoDescription: meta.seoDescription ?? null,
            ogImage: meta.ogImage ?? null,
            canonicalUrl: meta.canonicalUrl ?? null,
            noindex: meta.noindex ?? false,
            body,
            status,
            updatedAt: new Date(),
            publishedAt:
              status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
          })
          .where(eq(post.id, id));
        break;
      } catch (e) {
        if (isUniqueViolation(e) && attempt === 0) {
          nextSlug = `${slugify(nextSlug)}-${genId().slice(0, 5)}`;
          continue;
        }
        throw e;
      }
    }
    if (status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      await fanoutNewContent(existing.authorId, id);
    }
    return { id, status };
  }

  const newId = genId();
  let newSlug = await uniqueSlug(meta.slug || meta.title);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await db.insert(post).values({
        id: newId,
        authorId: actor.id,
        title: meta.title,
        slug: newSlug,
        type: meta.type,
        categoryId: meta.categoryId ?? null,
        thumbnail: meta.thumbnail ?? null,
        excerpt: meta.excerpt ?? null,
        mediaUrl: meta.mediaUrl ?? null,
        durationSec: meta.durationSec ?? null,
        repoUrl: meta.repoUrl ?? null,
        visibility: meta.visibility ?? "PUBLIC",
        seoTitle: meta.seoTitle ?? null,
        seoDescription: meta.seoDescription ?? null,
        ogImage: meta.ogImage ?? null,
        canonicalUrl: meta.canonicalUrl ?? null,
        noindex: meta.noindex ?? false,
        body,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      });
      break;
    } catch (e) {
      if (isUniqueViolation(e) && attempt === 0) {
        newSlug = `${slugify(newSlug)}-${genId().slice(0, 5)}`;
        continue;
      }
      throw e;
    }
  }
  if (status === "PUBLISHED") {
    await fanoutNewContent(actor.id, newId);
  }
  return { id: newId, status };
}

export async function moderatePost(
  actor: Actor,
  id: string,
  decision: "approve" | "reject",
): Promise<{ ok: true } | { error: string }> {
  if (actor.role !== "admin") return { error: "Hanya admin yang boleh memoderasi." };
  const existing = await db.query.post.findFirst({ where: eq(post.id, id) });
  if (!existing) return { error: "Konten tidak ditemukan." };
  const status = decision === "approve" ? "PUBLISHED" : "REJECTED";
  await db
    .update(post)
    .set({
      status,
      updatedAt: new Date(),
      publishedAt:
        decision === "approve" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    })
    .where(eq(post.id, id));
  if (decision === "approve") {
    await notify({
      userId: existing.authorId,
      type: "APPROVED",
      actorId: actor.id,
      postId: id,
    });
    if (existing.status !== "PUBLISHED") {
      await fanoutNewContent(existing.authorId, id);
    }
  } else {
    await notify({
      userId: existing.authorId,
      type: "REJECTED",
      actorId: actor.id,
      postId: id,
    });
  }
  return { ok: true };
}

export async function deletePost(
  actor: Actor,
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const existing = await db.query.post.findFirst({ where: eq(post.id, id) });
  if (!existing) return { error: "Konten tidak ditemukan." };
  if (existing.authorId !== actor.id && actor.role !== "admin") {
    return { error: "Anda tidak berhak menghapus konten ini." };
  }
  await db.delete(post).where(eq(post.id, id));
  return { ok: true };
}
