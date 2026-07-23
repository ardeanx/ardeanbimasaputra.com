import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import VideoCard from "@/components/cards/VideoCard";
import { category } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const t = await getT();
  const active = c ? await db.query.category.findFirst({ where: eq(category.slug, c) }) : null;

  const posts = await db.query.post.findMany({
    where: (p, { and, eq }) =>
      active
        ? and(eq(p.status, "PUBLISHED"), eq(p.visibility, "PUBLIC"), eq(p.categoryId, active.id))
        : and(eq(p.status, "PUBLISHED"), eq(p.visibility, "PUBLIC")),
    with: { author: true },
    orderBy: (p, { desc }) => [desc(p.publishedAt)],
    limit: 40,
  });

  return (
    <>
      <h1 className="sr-only">{t("nav.home")}</h1>
      <div className="card-grid px-4 pb-20 pt-3 sm:px-6">
        {posts.map((p) => (
          <VideoCard key={p.id} post={p} />
        ))}
      </div>
    </>
  );
}
