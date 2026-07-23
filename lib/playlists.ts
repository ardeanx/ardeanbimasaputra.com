import { and, asc, desc, eq } from "drizzle-orm";
import { playlist, playlistItem } from "@/db/schema";
import { db } from "./db";
import { genId } from "./id";
import type { Actor } from "./session";

export async function createPlaylist(
  userId: string,
  title: string,
  description?: string,
): Promise<{ id: string } | { error: string }> {
  const t = title.trim();
  if (!t) return { error: "Judul playlist tidak boleh kosong." };
  const id = genId();
  await db.insert(playlist).values({
    id,
    userId,
    title: t.slice(0, 120),
    description: description?.trim() || null,
  });
  return { id };
}

export async function deletePlaylist(
  actor: Actor,
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const pl = await db.query.playlist.findFirst({ where: eq(playlist.id, id) });
  if (!pl) return { error: "Playlist tidak ditemukan." };
  if (pl.userId !== actor.id && actor.role !== "admin")
    return { error: "Anda tidak berhak menghapus playlist ini." };
  await db.delete(playlist).where(eq(playlist.id, id));
  return { ok: true };
}

export async function togglePlaylistItem(
  actor: Actor,
  playlistId: string,
  postId: string,
): Promise<{ added: boolean } | { error: string }> {
  const pl = await db.query.playlist.findFirst({
    where: eq(playlist.id, playlistId),
  });
  if (!pl) return { error: "Playlist tidak ditemukan." };
  if (pl.userId !== actor.id) return { error: "Bukan playlist Anda." };

  const existing = await db.query.playlistItem.findFirst({
    where: (t, { and, eq }) => and(eq(t.playlistId, playlistId), eq(t.postId, postId)),
  });
  if (existing) {
    await db
      .delete(playlistItem)
      .where(and(eq(playlistItem.playlistId, playlistId), eq(playlistItem.postId, postId)));
    return { added: false };
  }
  await db.insert(playlistItem).values({ playlistId, postId }).onConflictDoNothing();
  await db.update(playlist).set({ updatedAt: new Date() }).where(eq(playlist.id, playlistId));
  return { added: true };
}

export async function listUserPlaylists(userId: string) {
  const rows = await db.query.playlist.findMany({
    where: eq(playlist.userId, userId),
    with: { items: { columns: { postId: true } } },
    orderBy: [desc(playlist.updatedAt)],
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    visibility: r.visibility,
    count: r.items.length,
  }));
}

export async function playlistsForPost(userId: string, postId: string) {
  const rows = await db.query.playlist.findMany({
    where: eq(playlist.userId, userId),
    with: { items: { columns: { postId: true } } },
    orderBy: [desc(playlist.updatedAt)],
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    has: r.items.some((i) => i.postId === postId),
  }));
}

export async function getPlaylist(id: string, viewerId: string | null) {
  const pl = await db.query.playlist.findFirst({
    where: eq(playlist.id, id),
    with: {
      user: true,
      items: {
        with: { post: { with: { author: true } } },
        orderBy: [asc(playlistItem.addedAt)],
      },
    },
  });
  if (!pl) return null;
  if (pl.visibility === "PRIVATE" && pl.userId !== viewerId) return null;
  const posts = pl.items.map((i) => i.post).filter((p) => p && p.status === "PUBLISHED");
  return {
    id: pl.id,
    title: pl.title,
    description: pl.description,
    visibility: pl.visibility,
    userId: pl.userId,
    owner: pl.user,
    posts,
  };
}
