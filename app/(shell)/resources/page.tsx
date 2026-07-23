import type { Metadata } from "next";
import { count, inArray, sum } from "drizzle-orm";
import { FolderDown } from "lucide-react";
import ResourceCard from "@/components/cards/ResourceCard";
import StoreToolbar, { type ToolbarFilter } from "@/components/store/StoreToolbar";
import EmptyState from "@/components/ui/EmptyState";
import { category, resourceFile } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("nav.resources"),
    description: t("resources.tagline"),
    alternates: { canonical: "/resources" },
  };
}

export default async function Resources({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; cat?: string }>;
}) {
  const t = await getT();
  const sp = await searchParams;
  const sort = sp.sort ?? "new";
  const cat = sp.cat ?? "";

  const all = await db.query.post.findMany({
    where: (t, { and, eq }) =>
      and(eq(t.status, "PUBLISHED"), eq(t.type, "RESOURCE"), eq(t.visibility, "PUBLIC")),
    with: { author: true },
    orderBy: (t, { desc }) => [desc(t.publishedAt)],
  });

  let items = cat ? all.filter((p) => String(p.categoryId) === cat) : all;
  if (sort === "views") items = [...items].sort((a, b) => b.viewCount - a.viewCount);

  const stats =
    items.length > 0
      ? await db
          .select({
            postId: resourceFile.postId,
            fileCount: count(),
            totalSize: sum(resourceFile.size),
          })
          .from(resourceFile)
          .where(
            inArray(
              resourceFile.postId,
              items.map((p) => p.id),
            ),
          )
          .groupBy(resourceFile.postId)
      : [];
  const byPost = new Map(stats.map((s) => [s.postId, s]));

  const usedCatIds = new Set(all.map((p) => p.categoryId).filter((id): id is number => id != null));
  const cats =
    usedCatIds.size > 0
      ? await db
          .select({ id: category.id, name: category.name })
          .from(category)
          .orderBy(category.name)
      : [];

  const filters: ToolbarFilter[] = [
    {
      param: "sort",
      ariaLabel: t("store.sortBy"),
      value: sort,
      def: "new",
      options: [
        { value: "new", label: t("store.sort.newest") },
        { value: "views", label: t("resources.sort.mostViewed") },
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
  ];

  return (
    <div className="px-6 pb-16">
      <h1 className="pt-6 text-2xl font-bold">{t("nav.resources")}</h1>
      <p className="mt-1 text-sm text-yt-text2">{t("resources.tagline")}</p>
      <StoreToolbar filters={filters} />
      {items.length === 0 ? (
        <EmptyState icon={<FolderDown />} title={t("resources.empty")} />
      ) : (
        <div className="mt-6 card-grid">
          {items.map((p) => {
            const s = byPost.get(p.id);
            return (
              <ResourceCard
                key={p.id}
                post={{
                  ...p,
                  fileCount: s?.fileCount ?? 0,
                  totalSize: Number(s?.totalSize ?? 0),
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
