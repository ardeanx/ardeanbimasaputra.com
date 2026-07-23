"use server";

import { revalidatePath } from "next/cache";
import {
  addComment,
  deleteComment,
  toggleBookmark,
  toggleCommentLike,
  toggleFollow,
  toggleReaction,
} from "@/lib/community";
import { markNotificationsRead, recentNotifications, unreadCount } from "@/lib/notifications";
import { actorOf, getSession } from "@/lib/session";

const NO_SESSION = { error: "Silakan masuk terlebih dahulu." } as const;

export async function addCommentAction(postId: string, body: string, parentId?: string) {
  const session = await getSession();
  if (!session) return NO_SESSION;
  const res = await addComment(actorOf(session.user), postId, body, parentId);
  if ("id" in res) revalidatePath("/watch");
  return res;
}

export async function deleteCommentAction(id: string) {
  const session = await getSession();
  if (!session) return NO_SESSION;
  const res = await deleteComment(actorOf(session.user), id);
  if ("ok" in res) revalidatePath("/watch");
  return res;
}

export async function toggleCommentLikeAction(id: string) {
  const session = await getSession();
  if (!session) return NO_SESSION;
  return toggleCommentLike(actorOf(session.user), id);
}

export async function toggleReactionAction(postId: string, value: 1 | -1) {
  const session = await getSession();
  if (!session) return NO_SESSION;
  return toggleReaction(actorOf(session.user), postId, value);
}

export async function toggleFollowAction(targetUserId: string) {
  const session = await getSession();
  if (!session) return NO_SESSION;
  return toggleFollow(actorOf(session.user), targetUserId);
}

export async function toggleBookmarkAction(postId: string) {
  const session = await getSession();
  if (!session) return NO_SESSION;
  return toggleBookmark(actorOf(session.user), postId);
}

export async function fetchNotificationsAction() {
  const session = await getSession();
  if (!session) return { items: [], unread: 0 };
  const [items, unread] = await Promise.all([
    recentNotifications(session.user.id),
    unreadCount(session.user.id),
  ]);
  return { items, unread };
}

export async function markNotificationsReadAction() {
  const session = await getSession();
  if (!session) return;
  await markNotificationsRead(session.user.id);
}
