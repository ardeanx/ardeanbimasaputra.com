import type { Metadata } from "next";
import { and, count, eq, inArray } from "drizzle-orm";
import { Store as StoreIcon } from "lucide-react";
import ProductCard from "@/components/cards/ProductCard";
import { KIND_LABEL_KEYS } from "@/components/cards/productKinds";
import StoreToolbar, { type ToolbarFilter } from "@/components/store/StoreToolbar";
import EmptyState from "@/components/ui/EmptyState";
import { category, entitlement } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { listPublishedProducts } from "@/lib/products";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("nav.store"),
    description: t("store.tagline"),
    alternates: { canonical: "/store" },
  };
}

export default async function Store({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    cat?: string;
    kind?: string;
    price?: string;
  }>;
}) {
  const t = await getT();
  const sp = await searchParams;
  const all = await listPublishedProducts();

  const sort = sp.sort ?? "new";
  const cat = sp.cat ?? "";
  const kind = sp.kind ?? "";
  const price = sp.price ?? "all";

  let items = all;
  if (cat) items = items.filter((p) => String(p.categoryId) === cat);
  if (kind) items = items.filter((p) => p.kind === kind);
  if (price === "free") items = items.filter((p) => p.price === 0);
  else if (price === "paid") items = items.filter((p) => p.price > 0);

  if (sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
  else if (sort === "popular") {
    const counts = new Map<string, number>();
    if (items.length > 0) {
      const rows = await db
        .select({ productId: entitlement.productId, c: count() })
        .from(entitlement)
        .where(
          inArray(
            entitlement.productId,
            items.map((p) => p.id),
          ),
        )
        .groupBy(entitlement.productId);
      for (const r of rows) counts.set(r.productId, Number(r.c));
    }
    items = [...items].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  }

  const usedCatIds = new Set(all.map((p) => p.categoryId).filter((id): id is number => id != null));
  const cats =
    usedCatIds.size > 0
      ? await db
          .select({ id: category.id, name: category.name })
          .from(category)
          .orderBy(category.name)
      : [];

  const session = await getSession();
  const viewerId = session?.user.id ?? null;
  let owned = new Set<string>();
  if (viewerId && items.length > 0) {
    const rows = await db
      .select({ productId: entitlement.productId })
      .from(entitlement)
      .where(
        and(
          eq(entitlement.userId, viewerId),
          inArray(
            entitlement.productId,
            items.map((p) => p.id),
          ),
        ),
      );
    owned = new Set(rows.map((r) => r.productId));
  }

  const filters: ToolbarFilter[] = [
    {
      param: "sort",
      ariaLabel: t("store.sortBy"),
      value: sort,
      def: "new",
      options: [
        { value: "new", label: t("store.sort.newest") },
        { value: "price-asc", label: t("store.sort.priceLow") },
        { value: "price-desc", label: t("store.sort.priceHigh") },
        { value: "popular", label: t("store.sort.popular") },
      ],
    },
    {
      param: "cat",
      ariaLabel: t("store.filter.category"),
      value: cat,
      def: "",
      chip: true,
      options: [
        { value: "", label: t("store.filter.allCategories") },
        ...cats
          .filter((c) => usedCatIds.has(c.id))
          .map((c) => ({ value: String(c.id), label: c.name })),
      ],
    },
    {
      param: "kind",
      ariaLabel: t("store.filter.kind"),
      value: kind,
      def: "",
      chip: true,
      options: [
        { value: "", label: t("store.filter.allKinds") },
        ...Object.entries(KIND_LABEL_KEYS).map(([value, key]) => ({
          value,
          label: t(key),
        })),
      ],
    },
    {
      param: "price",
      ariaLabel: t("store.filter.price"),
      value: price,
      def: "all",
      chip: true,
      options: [
        { value: "all", label: t("store.filter.allPrices") },
        { value: "free", label: t("store.free") },
        { value: "paid", label: t("store.filter.paid") },
      ],
    },
  ];

  return (
    <div className="px-6 pb-16">
      <h1 className="pt-6 text-2xl font-bold">{t("nav.store")}</h1>
      <p className="mt-1 text-sm text-yt-text2">{t("store.tagline")}</p>
      <StoreToolbar filters={filters} />
      {items.length === 0 ? (
        <EmptyState icon={<StoreIcon />} title={t("store.empty")} />
      ) : (
        <div className="mt-6 card-grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} owned={owned.has(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
