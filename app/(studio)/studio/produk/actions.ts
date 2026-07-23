"use server";

import { revalidatePath } from "next/cache";
import { deleteProduct, type ProductInput, saveProduct } from "@/lib/products";
import { listResourceFiles } from "@/lib/resources";
import { revalidateContent } from "@/lib/revalidate";
import { actorOf, getSession } from "@/lib/session";

function revalidateProduk() {
  revalidateContent();
  revalidatePath("/store");
  revalidatePath("/studio/produk");
}

export async function saveProductAction(
  input: ProductInput,
): Promise<{ id: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const res = await saveProduct(actorOf(session.user), input);
  if ("error" in res) return res;
  revalidateProduk();
  return res;
}

export async function deleteProductAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Harus masuk." };
  const res = await deleteProduct(actorOf(session.user), id);
  if ("error" in res) return res;
  revalidateProduk();
  return res;
}

export async function listProductFilesAction(productId: string) {
  const session = await getSession();
  if (!session) return [];
  const role = (session.user as { role?: string | null }).role ?? null;
  if (role !== "admin") return [];
  return listResourceFiles({ productId });
}
