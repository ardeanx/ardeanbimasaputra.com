import { createHash } from "node:crypto";
import { desc, eq, max } from "drizzle-orm";
import { entitlement, resourceFile } from "@/db/schema";
import { db } from "./db";
import { getT } from "./i18n";
import { genId } from "./id";
import type { Actor } from "./session";
import { putPrivate } from "./storage";

export const MAX_RESOURCE_BYTES = 100 * 1024 * 1024;

function extOf(filename: string): string {
  const m = /\.([a-z0-9]{1,10})$/i.exec(filename);
  return m ? m[1].toLowerCase() : "";
}

function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } };
  return err.code === "23505" || err.cause?.code === "23505";
}

export type FileOwner = { postId: string } | { productId: string };

function ownerWhere(owner: FileOwner) {
  return "postId" in owner
    ? eq(resourceFile.postId, owner.postId)
    : eq(resourceFile.productId, owner.productId);
}

export async function nextVersion(owner: FileOwner | string): Promise<number> {
  const o: FileOwner = typeof owner === "string" ? { postId: owner } : owner;
  const [row] = await db
    .select({ v: max(resourceFile.version) })
    .from(resourceFile)
    .where(ownerWhere(o));
  return (row?.v ?? 0) + 1;
}

export async function addResourceFile(
  owner: FileOwner | string,
  filename: string,
  data: Buffer,
): Promise<{ id: string } | { error: string }> {
  const o: FileOwner = typeof owner === "string" ? { postId: owner } : owner;
  const t = await getT();
  if (data.length === 0) return { error: t("resource.err.empty") };
  if (data.length > MAX_RESOURCE_BYTES) return { error: t("resource.err.tooLarge") };
  const name = filename.trim().slice(0, 255) || "berkas";
  const sha256 = createHash("sha256").update(data).digest("hex");
  const { key } = await putPrivate(data, extOf(name));
  const id = genId();
  for (let attempt = 0; attempt < 5; attempt++) {
    const version = await nextVersion(o);
    try {
      await db.insert(resourceFile).values({
        id,
        ...o,
        version,
        filename: name,
        size: data.length,
        sha256,
        storageKey: key,
      });
      return { id };
    } catch (e) {
      if (isUniqueViolation(e) && attempt < 4) continue;
      throw e;
    }
  }
  return { error: t("resource.err.saveConflict") };
}

export async function listResourceFiles(owner: FileOwner | string) {
  const o: FileOwner = typeof owner === "string" ? { postId: owner } : owner;
  return db
    .select({
      id: resourceFile.id,
      postId: resourceFile.postId,
      productId: resourceFile.productId,
      version: resourceFile.version,
      filename: resourceFile.filename,
      size: resourceFile.size,
      sha256: resourceFile.sha256,
      createdAt: resourceFile.createdAt,
    })
    .from(resourceFile)
    .where(ownerWhere(o))
    .orderBy(desc(resourceFile.version));
}

export async function deleteResourceFile(
  actor: Actor,
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const f = await db.query.resourceFile.findFirst({
    where: eq(resourceFile.id, id),
    with: { post: true, product: true },
  });
  const t = await getT();
  if (!f) return { error: t("resource.err.notFound") };
  const ownerId = f.product?.ownerId ?? f.post?.authorId;
  if (ownerId !== actor.id && actor.role !== "admin")
    return { error: t("resource.err.noDeletePermission") };
  await db.delete(resourceFile).where(eq(resourceFile.id, id));
  return { ok: true };
}

export async function hasEntitlement(userId: string, productId: string): Promise<boolean> {
  const row = await db.query.entitlement.findFirst({
    where: (t, { and, eq }) => and(eq(t.userId, userId), eq(t.productId, productId)),
  });
  return !!row;
}

export async function grantEntitlement(
  userId: string,
  productId: string,
  source: string,
): Promise<void> {
  await db.insert(entitlement).values({ userId, productId, source }).onConflictDoNothing();
}

export async function canDownload(
  user: { id: string; role: string | null } | null,
  file: {
    post: { authorId: string; status: string } | null;
    product: { id: string; ownerId: string; price: number; status: string } | null;
  },
): Promise<boolean> {
  if (file.product) {
    const pr = file.product;
    const isOwnerOrAdmin = !!user && (user.id === pr.ownerId || user.role === "admin");
    if (isOwnerOrAdmin) return true;
    if (pr.status !== "PUBLISHED") return false;
    if (pr.price === 0) return true;
    if (!user) return false;
    return hasEntitlement(user.id, pr.id);
  }
  if (file.post) {
    if (file.post.status === "PUBLISHED") return true;
    return !!user && (user.id === file.post.authorId || user.role === "admin");
  }
  return false;
}
