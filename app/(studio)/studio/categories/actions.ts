"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { category } from "@/db/schema";
import { db } from "@/lib/db";
import { revalidateContent } from "@/lib/revalidate";
import { getSession } from "@/lib/session";

type ActionResult = { ok: true } | { error: string };

async function requireAdminSession(): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Harus masuk.";
  const role = (session.user as { role?: string | null }).role ?? null;
  if (role !== "admin") return "Hanya admin yang berhak.";
  return null;
}

function slugBase(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "kategori"
  );
}

async function uniqueSlug(name: string, excludeId?: number): Promise<string> {
  const base = slugBase(name);
  let candidate = base;
  for (let n = 2; ; n++) {
    const clash = await db.query.category.findFirst({
      where: eq(category.slug, candidate),
    });
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${base}-${n}`;
  }
}

function validName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 40) return null;
  return trimmed;
}

function refresh(): void {
  revalidatePath("/studio/categories");
  revalidateContent();
}

export async function addCategoryAction(name: string): Promise<ActionResult> {
  const denied = await requireAdminSession();
  if (denied) return { error: denied };
  const trimmed = validName(name);
  if (!trimmed) return { error: "Nama kategori harus 1-40 karakter." };
  const slug = await uniqueSlug(trimmed);
  await db.insert(category).values({ name: trimmed, slug });
  refresh();
  return { ok: true };
}

export async function renameCategoryAction(id: number, name: string): Promise<ActionResult> {
  const denied = await requireAdminSession();
  if (denied) return { error: denied };
  const trimmed = validName(name);
  if (!trimmed) return { error: "Nama kategori harus 1-40 karakter." };
  const existing = await db.query.category.findFirst({
    where: eq(category.id, id),
  });
  if (!existing) return { error: "Kategori tidak ditemukan." };
  const slug = await uniqueSlug(trimmed, id);
  await db.update(category).set({ name: trimmed, slug }).where(eq(category.id, id));
  refresh();
  return { ok: true };
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  const denied = await requireAdminSession();
  if (denied) return { error: denied };
  const existing = await db.query.category.findFirst({
    where: eq(category.id, id),
  });
  if (!existing) return { error: "Kategori tidak ditemukan." };
  await db.delete(category).where(eq(category.id, id));
  refresh();
  return { ok: true };
}
