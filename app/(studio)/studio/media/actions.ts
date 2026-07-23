"use server";

import { mediaFile } from "@/db/schema";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { remove } from "@/lib/storage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { error: string };

export async function deleteMediaAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: (await getT())("msg.mustSignIn") };
  const role = (session.user as { role?: string | null }).role ?? null;
  const row = await db.query.mediaFile.findFirst({
    where: eq(mediaFile.id, id),
  });
  if (!row) return { error: (await getT())("msg.fileNotFound") };
  if (row.uploaderId !== session.user.id && role !== "admin") {
    return { error: (await getT())("msg.noDeletePermission") };
  }
  await remove(row.key);
  await db.delete(mediaFile).where(eq(mediaFile.id, id));
  revalidatePath("/studio/media");
  return { ok: true };
}
