import Link from "next/link";
import VideoCard from "@/components/cards/VideoCard";
import RenderDoc from "@/components/content/RenderDoc";
import DetailTabs from "@/components/detail/DetailTabs";
import type { DetailPost } from "@/components/detail/types";
import { CheckBadgeIcon } from "@/components/shell/icons";
import Comments from "@/components/watch/Comments";
import LikeButton from "@/components/watch/LikeButton";
import ResourceDownloads from "@/components/watch/ResourceDownloads";
import ViewPing from "@/components/watch/ViewPing";
import { postLikeState } from "@/lib/community";
import { prepareDoc } from "@/lib/content";
import { localizePost } from "@/lib/content-translation";
import { db } from "@/lib/db";
import { getFmt } from "@/lib/format-server";
import { getLocale, getT } from "@/lib/i18n";

export default async function ResourceView({
  post: p,
  viewerId,
}: {
  post: DetailPost;
  viewerId: string | null;
}) {
  const locale = await getLocale();
  const lp = await localizePost(p, locale);
  const [t, fmt] = await Promise.all([getT(), getFmt()]);
  const [doc, likeState, related] = await Promise.all([
    prepareDoc(lp.body),
    postLikeState(p.id, viewerId ?? undefined),
    db.query.post.findMany({
      where: (t, { and, eq, ne }) =>
        and(
          eq(t.status, "PUBLISHED"),
          eq(t.visibility, "PUBLIC"),
          eq(t.type, "RESOURCE"),
          ne(t.id, p.id),
        ),
      with: { author: true },
      orderBy: (t, { desc }) => [desc(t.viewCount)],
      limit: 3,
    }),
  ]);
  const date = p.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(p.publishedAt)
    : null;

  return (
    <div data-smart-hide className="mx-auto max-w-4xl px-4 pb-16 pt-6 lg:px-6">
      <div className="immersive-page" hidden aria-hidden />
      <ViewPing postId={p.id} />

      <header>
        <div className="flex flex-wrap items-center gap-2">
          {p.category && (
            <span className="rounded-full bg-yt-chip px-3 py-1 text-xs font-medium">
              {p.category.name}
            </span>
          )}
          {lp.translatedLocale && (
            <span className="rounded-full bg-yt-chip px-3 py-1 text-xs text-yt-text2">
              {t("post.autoTranslated")}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{lp.title}</h1>

        {lp.excerpt && <p className="mt-3 text-base leading-7 text-yt-text2">{lp.excerpt}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href={`/@${p.author.username}`} className="flex items-center gap-3">
            <img src={p.author.image ?? ""} alt="" className="h-10 w-10 rounded-full bg-yt-hover" />
            <span>
              <span className="flex items-center gap-1 text-sm font-medium">
                {p.author.name}
                {(p.author.role === "admin" || p.author.verified) && <CheckBadgeIcon />}
              </span>
              <span className="text-xs text-yt-text2">{t("post.author")}</span>
            </span>
          </Link>
          <span className="ml-auto text-sm text-yt-text2">
            {fmt.views(p.viewCount, p.type)} • {fmt.ago(p.publishedAt)}
            {date ? ` • ${date}` : ""}
          </span>
        </div>

        <div className="mt-4">
          <LikeButton
            postId={p.id}
            initialLikeCount={likeState.likeCount}
            initialReaction={likeState.reaction}
            disabled={!viewerId}
          />
        </div>
      </header>

      <div className="mt-8">
        <DetailTabs
          tabs={[
            {
              key: "detail",
              label: t("resource.tabDetail"),
              panel: (
                <article className="max-w-prose text-[16px] leading-8">
                  <RenderDoc doc={doc} />
                </article>
              ),
            },
            {
              key: "files",
              label: t("resource.tabFiles"),
              panel: <ResourceDownloads postId={p.id} />,
            },
            {
              key: "comments",
              label: t("resource.tabComments"),
              panel: <Comments postId={p.id} />,
            },
          ]}
        />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">{t("post.related")}</h2>
          <div className="mt-4 card-grid">
            {related.map((r) => (
              <VideoCard key={r.id} post={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
