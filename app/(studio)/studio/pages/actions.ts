"use server";

import { revalidatePath } from "next/cache";
import { deletePage, type PageInput, savePage } from "@/lib/pages";
import { requireAdmin } from "@/lib/session";

export async function savePageAction(
  input: PageInput,
): Promise<{ id: string } | { error: string }> {
  const session = await requireAdmin();
  const res = await savePage(session.user.id, input);
  revalidatePath("/studio/pages");
  revalidatePath("/", "layout");
  return res;
}

export async function deletePageAction(id: string): Promise<void> {
  await requireAdmin();
  await deletePage(id);
  revalidatePath("/studio/pages");
  revalidatePath("/", "layout");
}
