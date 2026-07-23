import { and, desc, eq } from "drizzle-orm";
import { product } from "@/db/schema";
import { db } from "./db";
import { getT } from "./i18n";
import { genId } from "./id";
import { slugify } from "./posts";
import type { Actor } from "./session";

export type ProductKind = "DIGITAL" | "SOURCE_CODE" | "PHYSICAL" | "SERVICE";
export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ProductInput = {
  id?: string;
  title: string;
  slug?: string;
  description: string;
  body: unknown;
  kind: ProductKind;
  status: ProductStatus;
  price: number;
  stock: number | null;
  thumbnail: string | null;
  gallery: string[];
  tags: string[];
  attributes?: { label: string; value: string }[];
  variants?: { name: string; options: string[] }[];
  version: string | null;
  license: string | null;
  demoUrl: string | null;
  repoUrl: string | null;
  categoryId: number | null;
  postId: string | null;
};

export async function listAllProducts() {
  return db.query.product.findMany({
    with: { owner: { columns: { name: true } } },
    orderBy: [desc(product.updatedAt)],
  });
}

export async function getProduct(id: string) {
  return db.query.product.findFirst({ where: eq(product.id, id) });
}

export async function listPublishedProducts() {
  return db.query.product.findMany({
    where: eq(product.status, "PUBLISHED"),
    with: { owner: true },
    orderBy: [desc(product.createdAt)],
  });
}

export async function getPublicProductBySlug(slug: string) {
  return db.query.product.findFirst({
    where: and(eq(product.slug, slug), eq(product.status, "PUBLISHED")),
    with: {
      owner: true,
      post: true,
      category: true,
      files: { orderBy: (t, { desc: d }) => [d(t.version)] },
    },
  });
}

async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired) || "produk";
  const clash = await db.query.product.findFirst({
    where: eq(product.slug, base),
  });
  if (!clash || clash.id === excludeId) return base;
  return `${base}-${genId().slice(0, 5)}`;
}

export async function saveProduct(
  actor: Actor,
  input: ProductInput,
): Promise<{ id: string } | { error: string }> {
  const t = await getT();
  if (actor.role !== "admin") return { error: t("common.adminOnly") };
  const title = input.title.trim();
  if (!title) return { error: t("product.err.titleRequired") };
  const price = Number.isFinite(input.price) ? Math.max(0, Math.floor(input.price)) : 0;
  const stock =
    input.kind === "PHYSICAL" && input.stock !== null ? Math.max(0, Math.floor(input.stock)) : null;
  const slug = await uniqueSlug(input.slug?.trim() || title, input.id);
  const body =
    input.body && typeof input.body === "object" && (input.body as { type?: string }).type === "doc"
      ? input.body
      : null;
  const values = {
    title,
    slug,
    description: input.description.trim() || null,
    body,
    kind: input.kind,
    status: input.status,
    price,
    stock,
    thumbnail: input.thumbnail || null,
    gallery: (input.gallery ?? []).filter(Boolean).slice(0, 12),
    tags: (input.tags ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20),
    attributes: (input.attributes ?? [])
      .map((a) => ({ label: a.label.trim(), value: a.value.trim() }))
      .filter((a) => a.label || a.value)
      .slice(0, 30),
    variants: (input.variants ?? [])
      .map((v) => ({
        name: v.name.trim(),
        options: (v.options ?? [])
          .map((o) => o.trim())
          .filter(Boolean)
          .slice(0, 20),
      }))
      .filter((v) => v.name && v.options.length > 0)
      .slice(0, 10),
    version: input.version?.trim() || null,
    license: input.license?.trim() || null,
    demoUrl: input.demoUrl?.trim() || null,
    repoUrl: input.repoUrl?.trim() || null,
    categoryId: input.categoryId ?? null,
    postId: input.postId || null,
    updatedAt: new Date(),
  };

  if (input.id) {
    const existing = await getProduct(input.id);
    if (!existing) return { error: t("product.err.notFound") };
    await db.update(product).set(values).where(eq(product.id, input.id));
    return { id: input.id };
  }

  const id = genId();
  await db.insert(product).values({ id, ownerId: actor.id, ...values });
  return { id };
}

export async function deleteProduct(
  actor: Actor,
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const t = await getT();
  if (actor.role !== "admin") return { error: t("common.adminOnly") };
  const existing = await getProduct(id);
  if (!existing) return { error: t("product.err.notFound") };
  await db.delete(product).where(eq(product.id, id));
  return { ok: true };
}
