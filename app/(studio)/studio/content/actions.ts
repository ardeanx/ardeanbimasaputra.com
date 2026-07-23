"use server";

import { inArray } from "drizzle-orm";
import { post } from "@/db/schema";
import { db } from "@/lib/db";
import { revalidateContent } from "@/lib/revalidate";
import { getSession } from "@/lib/session";

type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE";

async function ownedIds(userId: string, isAdmin: boolean, ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.query.post.findMany({
    where: inArray(post.id, ids),
    columns: { id: true, authorId: true },
  });
  return rows.filter((r) => isAdmin || r.authorId === userId).map((r) => r.id);
}

export async function setVisibilityAction(
  id: string,
  visibility: Visibility,
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const isAdmin = (session.user as { role?: string | null }).role === "admin";
  const allowed = await ownedIds(session.user.id, isAdmin, [id]);
  if (allowed.length === 0) return { error: "Tidak berhak." };
  await db.update(post).set({ visibility, updatedAt: new Date() }).where(inArray(post.id, allowed));
  revalidateContent();
  return { ok: true };
}

export async function bulkDeleteAction(
  ids: string[],
): Promise<{ deleted: number } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const isAdmin = (session.user as { role?: string | null }).role === "admin";
  const allowed = await ownedIds(session.user.id, isAdmin, ids);
  if (allowed.length === 0) return { error: "Tidak ada yang bisa dihapus." };
  await db.delete(post).where(inArray(post.id, allowed));
  revalidateContent();
  return { deleted: allowed.length };
}

export async function bulkVisibilityAction(
  ids: string[],
  visibility: Visibility,
): Promise<{ updated: number } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const isAdmin = (session.user as { role?: string | null }).role === "admin";
  const allowed = await ownedIds(session.user.id, isAdmin, ids);
  if (allowed.length === 0) return { error: "Tidak ada yang bisa diubah." };
  await db.update(post).set({ visibility, updatedAt: new Date() }).where(inArray(post.id, allowed));
  revalidateContent();
  return { updated: allowed.length };
}
