import { asc, desc, eq } from "drizzle-orm";
import ProductForm from "@/components/studio/admin/ProductForm";
import { category, post } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProdukBaru() {
  await requireAdmin();
  const t = await getT();
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
      <h1 className="mb-6 text-2xl font-semibold">{t("studio.produk.newProduct")}</h1>
      <ProductForm posts={posts} categories={categories} />
    </div>
  );
}
