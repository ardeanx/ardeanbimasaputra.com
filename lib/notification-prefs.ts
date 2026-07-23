import { eq } from "drizzle-orm";
import { notificationPref } from "@/db/schema";
import { db } from "./db";

export type NotifPrefs = {
  comments: boolean;
  replies: boolean;
  follows: boolean;
  newContent: boolean;
};

const DEFAULTS: NotifPrefs = {
  comments: true,
  replies: true,
  follows: true,
  newContent: true,
};

export async function getNotifPrefs(userId: string): Promise<NotifPrefs> {
  const row = await db.query.notificationPref.findFirst({
    where: eq(notificationPref.userId, userId),
  });
  if (!row) return DEFAULTS;
  return {
    comments: row.comments,
    replies: row.replies,
    follows: row.follows,
    newContent: row.newContent,
  };
}

export async function saveNotifPrefs(userId: string, prefs: NotifPrefs): Promise<void> {
  await db
    .insert(notificationPref)
    .values({ userId, ...prefs })
    .onConflictDoUpdate({ target: notificationPref.userId, set: prefs });
}

const TYPE_TO_PREF: Record<string, keyof NotifPrefs | undefined> = {
  COMMENT: "comments",
  REPLY: "replies",
  FOLLOW: "follows",
  NEW_CONTENT: "newContent",
};

export async function isNotifAllowed(userId: string, type: string): Promise<boolean> {
  const key = TYPE_TO_PREF[type];
  if (!key) return true;
  const prefs = await getNotifPrefs(userId);
  return prefs[key];
}
