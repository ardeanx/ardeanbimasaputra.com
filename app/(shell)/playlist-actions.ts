"use server";

import { revalidatePath } from "next/cache";
import {
  createPlaylist,
  deletePlaylist,
  playlistsForPost,
  togglePlaylistItem,
} from "@/lib/playlists";
import { actorOf, getSession } from "@/lib/session";

export async function createPlaylistAction(title: string, postId?: string) {
  const session = await getSession();
  if (!session) return { error: "Masuk dulu untuk membuat playlist." };
  const res = await createPlaylist(session.user.id, title);
  if ("id" in res && postId) await togglePlaylistItem(actorOf(session.user), res.id, postId);
  revalidatePath("/feed/playlist");
  return res;
}

export async function togglePlaylistItemAction(playlistId: string, postId: string) {
  const session = await getSession();
  if (!session) return { error: "Masuk dulu." };
  return togglePlaylistItem(actorOf(session.user), playlistId, postId);
}

export async function deletePlaylistAction(id: string) {
  const session = await getSession();
  if (!session) return { error: "Masuk dulu." };
  const res = await deletePlaylist(actorOf(session.user), id);
  revalidatePath("/feed/playlist");
  return res;
}

export async function playlistsForPostAction(postId: string) {
  const session = await getSession();
  if (!session) return [];
  return playlistsForPost(session.user.id, postId);
}
