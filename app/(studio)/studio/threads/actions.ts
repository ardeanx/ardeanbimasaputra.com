"use server";

import { getSession } from "@/lib/session";
import { createThreadTopic, setThreadRemoved } from "@/lib/threads";

type Result = { ok: true } | { error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session) return null;
  const role = (session.user as { role?: string | null }).role ?? null;
  return role === "admin" ? session : null;
}

export async function moderateThreadAction(
  targetType: "post" | "comment",
  id: string,
  removed: boolean,
): Promise<Result> {
  if (!(await requireAdmin())) return { error: "thread.err.admin" };
  await setThreadRemoved(targetType, id, removed);
  return { ok: true };
}

export async function createTopicAction(input: {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}): Promise<{ ok: true; id: string } | { error: string }> {
  if (!(await requireAdmin())) return { error: "thread.err.admin" };
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!name || !slug) return { error: "thread.err.topicInput" };
  const id = await createThreadTopic({
    name,
    slug,
    description: input.description?.trim() || undefined,
    color: input.color?.trim() || undefined,
  });
  return { ok: true, id };
}
