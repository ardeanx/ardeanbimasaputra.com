"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { session as sessionTable, user } from "@/db/schema";
import { db } from "@/lib/db";
import { revalidateContent } from "@/lib/revalidate";
import { getSession } from "@/lib/session";

type Result = { ok: true } | { error: string };

async function guardTarget(targetId: string): Promise<{ error: string } | null> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const role = (session.user as { role?: string | null }).role ?? null;
  if (role !== "admin") return { error: "Tidak berhak." };
  if (session.user.id === targetId) return { error: "Tidak bisa mengubah akun sendiri." };
  return null;
}

async function isLastAdmin(targetId: string): Promise<boolean> {
  const target = await db.query.user.findFirst({
    where: eq(user.id, targetId),
    columns: { role: true },
  });
  if (target?.role !== "admin") return false;
  const [row] = await db.select({ n: count() }).from(user).where(eq(user.role, "admin"));
  return Number(row?.n ?? 0) <= 1;
}

function refresh() {
  revalidateContent();
  revalidatePath("/studio/users");
}

export async function setRoleAction(userId: string, role: "member" | "admin"): Promise<Result> {
  const guard = await guardTarget(userId);
  if (guard) return guard;
  if (role === "member" && (await isLastAdmin(userId)))
    return { error: "Tidak bisa menurunkan admin terakhir." };
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId));
  refresh();
  return { ok: true };
}

export async function banUserAction(userId: string, reason: string): Promise<Result> {
  const guard = await guardTarget(userId);
  if (guard) return guard;
  if (await isLastAdmin(userId)) return { error: "Tidak bisa memblokir admin terakhir." };
  await db
    .update(user)
    .set({
      banned: true,
      banReason: reason,
      banExpires: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
  refresh();
  return { ok: true };
}

export async function unbanUserAction(userId: string): Promise<Result> {
  const guard = await guardTarget(userId);
  if (guard) return guard;
  await db
    .update(user)
    .set({ banned: false, banReason: null, updatedAt: new Date() })
    .where(eq(user.id, userId));
  refresh();
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<Result> {
  const guard = await guardTarget(userId);
  if (guard) return guard;
  if (await isLastAdmin(userId)) return { error: "Tidak bisa menghapus admin terakhir." };
  await db.delete(user).where(eq(user.id, userId));
  refresh();
  return { ok: true };
}
