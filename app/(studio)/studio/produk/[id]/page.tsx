import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductForm from "@/components/studio/admin/ProductForm";
import { category, post } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProdukEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const t = await getT();
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();

  const posts = await db
    .select({ id: post.id, title: post.title })
    .from(post)
    .where(eq(post.status, "PUBLISHED"))
    .orderBy(desc(post.publishedAt))
    .limit(100);
  const categories = await db
    .select({ id: category.id, name: category.name })
    .from(category)
    .orderBy(asc(category.name));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">{t("studio.produk.editProduct")}</h1>
      <ProductForm
        posts={posts}
        categories={categories}
        defaults={{
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description ?? "",
          body: p.body,
          kind: p.kind,
          status: p.status,
          price: p.price,
          stock: p.stock,
          thumbnail: p.thumbnail,
          gallery: p.gallery ?? [],
          tags: p.tags ?? [],
          attributes: p.attributes ?? [],
          variants: p.variants ?? [],
          version: p.version,
          license: p.license,
          demoUrl: p.demoUrl,
          repoUrl: p.repoUrl,
          categoryId: p.categoryId,
          postId: p.postId,
        }}
      />
    </div>
  );
}
