import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CardMenu from "@/components/cards/CardMenu";
import { cardHref } from "@/components/cards/href";
import { CheckBadgeIcon } from "@/components/shell/icons";
import EmptyState from "@/components/ui/EmptyState";
import { db } from "@/lib/db";
import { bodyText } from "@/lib/format";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("search.button"),
    robots: { index: false, follow: true },
  };
}

export default async function Results({
  searchParams,
}: {
  searchParams: Promise<{ search_query?: string }>;
}) {
  const { search_query: q } = await searchParams;
  const t = await getT();
  const fmt = await getFmt();

  const rows = q
    ? await db.query.post.findMany({
        where: (t, { and, eq, ilike, or }) =>
          and(
            eq(t.status, "PUBLISHED"),
            eq(t.visibility, "PUBLIC"),
            or(ilike(t.title, `%${q}%`), ilike(t.excerpt, `%${q}%`)),
          ),
        with: { author: true },
        orderBy: (t, { desc }) => [desc(t.viewCount)],
        limit: 20,
      })
    : [];

  return (
    <div className="mx-auto max-w-[1096px] px-6 py-4">
      {q && rows.length === 0 && (
        <EmptyState
          icon={<SearchX />}
          title={t("results.empty", { q })}
          description={t("results.emptyHint")}
          action={{ label: t("nav.explore"), href: "/" }}
        />
      )}
      {rows.map((r) => {
        const href = cardHref(r);
        return (
          <div key={r.id} className="group flex flex-col gap-4 py-4 sm:flex-row">
            <Link
              href={href}
              className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-yt-hover sm:w-[360px]"
            >
              {r.thumbnail && (
                <Image
                  src={r.thumbnail}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 360px"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="flex min-w-0 flex-1 gap-2">
              <div className="min-w-0 flex-1">
                <Link href={href}>
                  <h3 className="line-clamp-2 text-lg leading-6">{r.title}</h3>
                </Link>
                <p className="mt-1 text-xs text-yt-text2">
                  {fmt.views(r.viewCount, r.type)} • {fmt.ago(r.publishedAt)}
                </p>
                <Link
                  href={`/@${r.author.username}`}
                  className="mt-2 flex items-center gap-2 text-xs text-yt-text2 hover:text-yt-text"
                >
                  <img
                    src={r.author.image ?? ""}
                    alt=""
                    className="h-6 w-6 rounded-full bg-yt-hover"
                  />
                  {r.author.name}
                  {r.author.role === "admin" && <CheckBadgeIcon />}
                </Link>
                <p className="mt-2 line-clamp-2 text-xs text-yt-text2">
                  {r.excerpt ?? bodyText(r.body)}
                </p>
              </div>
              <div className="shrink-0 self-start">
                <CardMenu url={href} postId={r.id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
