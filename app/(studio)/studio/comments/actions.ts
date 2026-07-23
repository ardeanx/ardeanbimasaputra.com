"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { comment } from "@/db/schema";
import { db } from "@/lib/db";
import { revalidateContent } from "@/lib/revalidate";
import { getSession } from "@/lib/session";

export async function deleteCommentAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  if ((session.user as { role?: string | null }).role !== "admin")
    return { error: "Tidak berhak." };
  await db.delete(comment).where(eq(comment.id, id));
  revalidatePath("/studio/comments");
  revalidateContent();
  return { ok: true };
}
