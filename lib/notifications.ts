import { and, count, eq, inArray } from "drizzle-orm";
import { follow, notification, notificationPref, user } from "@/db/schema";
import { db } from "./db";
import { genId } from "./id";
import { isNotifAllowed } from "./notification-prefs";
import { sendPushToUsers } from "./push";
import { getSettings } from "./settings";

type NotifType =
  | "COMMENT"
  | "REPLY"
  | "FOLLOW"
  | "LIKE"
  | "APPROVED"
  | "REJECTED"
  | "NEW_CONTENT"
  | "NEW_USER"
  | "PURCHASE"
  | "ANNOUNCEMENT"
  | "SYSTEM";

type NotifCategory = "socials" | "announcements" | "system";

type NewNotif = {
  userId: string;
  type: NotifType;
  actorId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  meta?: Record<string, unknown> | null;
};

export function categoryOf(type: NotifType): NotifCategory {
  if (type === "COMMENT" || type === "REPLY" || type === "FOLLOW" || type === "LIKE")
    return "socials";
  if (type === "ANNOUNCEMENT" || type === "NEW_CONTENT") return "announcements";
  return "system";
}

export async function notify(n: NewNotif): Promise<void> {
  if (n.actorId && n.actorId === n.userId) return;
  if (n.type === "COMMENT" || n.type === "REPLY") {
    const s = await getSettings();
    if (!s.system.notifyComments) return;
  }
  if (!(await isNotifAllowed(n.userId, n.type))) return;
  await db.insert(notification).values({ id: genId(), ...n });
}

export async function notifyAdmins(n: Omit<NewNotif, "userId">): Promise<void> {
  const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"));
  for (const a of admins) await notify({ ...n, userId: a.id });
}

const FANOUT_CEILING = 5000;

export async function fanoutNewContent(authorId: string, postId: string): Promise<void> {
  const s = await getSettings();
  if (!s.system.fanoutNewContent) return;
  const followers = await db
    .select({ followerId: follow.followerId })
    .from(follow)
    .where(eq(follow.followingId, authorId))
    .limit(FANOUT_CEILING);
  if (followers.length === 0) return;
  const followerIds = followers.map((f) => f.followerId);
  const muted = await db
    .select({ userId: notificationPref.userId })
    .from(notificationPref)
    .where(
      and(inArray(notificationPref.userId, followerIds), eq(notificationPref.newContent, false)),
    );
  const mutedSet = new Set(muted.map((m) => m.userId));
  const recipients = followers.filter((f) => !mutedSet.has(f.followerId));
  if (recipients.length === 0) return;
  await db.insert(notification).values(
    recipients.map((f) => ({
      id: genId(),
      userId: f.followerId,
      type: "NEW_CONTENT" as const,
      actorId: authorId,
      postId,
    })),
  );
  void sendPushToUsers(recipients.map((f) => f.followerId)).catch(() => {});
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notification)
    .set({ read: true })
    .where(and(eq(notification.userId, userId), eq(notification.read, false)));
}

export async function recentNotifications(userId: string, limit = 20) {
  return db.query.notification.findMany({
    where: (t, { eq }) => eq(t.userId, userId),
    with: {
      actor: { columns: { name: true, username: true, image: true } },
      post: { columns: { id: true, title: true, slug: true, thumbnail: true } },
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
  });
}

export async function unreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notification)
    .where(and(eq(notification.userId, userId), eq(notification.read, false)));
  return row.n;
}
