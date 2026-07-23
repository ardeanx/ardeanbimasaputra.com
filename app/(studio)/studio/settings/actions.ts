"use server";

import { ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { session as sessionTable } from "@/db/schema";
import { rebuildAuthProviders } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { saveSettings } from "@/lib/settings";

type Result = { ok: true } | { error: string };

async function adminSession() {
  const session = await getSession();
  if (!session) return null;
  const role = (session.user as { role?: string | null }).role ?? null;
  return role === "admin" ? session : null;
}

export async function saveSettingsAction(patch: unknown): Promise<Result> {
  const session = await adminSession();
  if (!session) return { error: "Tidak berhak." };
  const res = await saveSettings(patch);
  if ("error" in res) return { error: res.error };
  await rebuildAuthProviders().catch(() => {});
  revalidatePath("/", "layout");
  revalidatePath("/studio/settings");
  return { ok: true };
}

export async function revokeAllSessionsAction(): Promise<
  { ok: true; count: number } | { error: string }
> {
  const session = await adminSession();
  if (!session) return { error: "Tidak berhak." };
  const deleted = await db
    .delete(sessionTable)
    .where(ne(sessionTable.token, session.session.token))
    .returning({ id: sessionTable.id });
  revalidatePath("/studio/settings");
  return { ok: true, count: deleted.length };
}
