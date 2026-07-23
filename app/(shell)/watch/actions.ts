"use server";

import { headers } from "next/headers";
import { recordView } from "@/lib/community";
import { getSession } from "@/lib/session";
import { registerView } from "@/lib/views";

export async function pingView(postId: string): Promise<void> {
  const session = await getSession();
  const h = await headers();
  const viewer = session?.user.id ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  await registerView(postId, viewer);
  if (session) await recordView(session.user.id, postId);
}
