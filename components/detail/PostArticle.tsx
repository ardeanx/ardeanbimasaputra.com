import Image from "next/image";
import Link from "next/link";
import AdSlots from "@/components/ads/AdSlots";
import ArticleWithAd from "@/components/ads/ArticleWithAd";
import VideoCard from "@/components/cards/VideoCard";
import { extractHeadings } from "@/components/content/RenderDoc";
import type { DetailPost } from "@/components/detail/types";
import SavePlaylistButton from "@/components/playlist/SavePlaylistButton";
import Toc from "@/components/post/Toc";
import JsonLd from "@/components/seo/JsonLd";
import { CheckBadgeIcon } from "@/components/shell/icons";
import BookmarkButton from "@/components/watch/BookmarkButton";
import Comments from "@/components/watch/Comments";
import LikeButton from "@/components/watch/LikeButton";
import ShareButton from "@/components/watch/ShareButton";
import ViewPing from "@/components/watch/ViewPing";
import { isBookmarked, postLikeState } from "@/lib/community";
import { prepareDoc } from "@/lib/content";
import { localizePost } from "@/lib/content-translation";
import { db } from "@/lib/db";
import { getFmt } from "@/lib/format-server";
import { getLocale, getT } from "@/lib/i18n";
import { blogPosting } from "@/lib/jsonld";
import { baseUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export default async function PostArticle({
  post: p,
  viewerId,
}: {
  post: DetailPost;
  viewerId: string | null;
}) {
  const locale = await getLocale();
  const lp = await localizePost(p, locale);
  const [t, fmt, settings] = await Promise.all([getT(), getFmt(), getSettings()]);
  const base = baseUrl();
  const publisher: Record<string, unknown> = {
    "@type": "Organization",
    name: settings.seo.localSeo.websiteName || settings.seo.siteTitle,
  };
  if (settings.seo.localSeo.logo) {
    publisher.logo = new URL(settings.seo.localSeo.logo, base).toString();
  }

  const [doc, likeState, prev, next, readNext, saved] = await Promise.all([
    prepareDoc(lp.body),
    postLikeState(p.id, viewerId ?? undefined),
    p.publishedAt
      ? db.query.post.findFirst({
          where: (t, { and, eq, lt, ne }) =>
            and(
              eq(t.status, "PUBLISHED"),
              eq(t.visibility, "PUBLIC"),
              eq(t.type, "POST"),
              ne(t.id, p.id),
              lt(t.publishedAt, p.publishedAt!),
            ),
          orderBy: (t, { desc }) => [desc(t.publishedAt)],
        })
      : Promise.resolve(undefined),
    p.publishedAt
      ? db.query.post.findFirst({
          where: (t, { and, eq, gt, ne }) =>
            and(
              eq(t.status, "PUBLISHED"),
              eq(t.visibility, "PUBLIC"),
              eq(t.type, "POST"),
              ne(t.id, p.id),
              gt(t.publishedAt, p.publishedAt!),
            ),
          orderBy: (t, { asc }) => [asc(t.publishedAt)],
        })
      : Promise.resolve(undefined),
    db.query.post.findMany({
      where: (t, { and, eq, ne }) =>
        and(
          eq(t.status, "PUBLISHED"),
          eq(t.visibility, "PUBLIC"),
          eq(t.type, "POST"),
          ne(t.id, p.id),
        ),
      with: { author: true },
      orderBy: (t, { desc }) => [desc(t.viewCount)],
      limit: 3,
    }),
    viewerId ? isBookmarked(viewerId, p.id) : Promise.resolve(false),
  ]);
  const headings = extractHeadings(doc);
  const date = p.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(p.publishedAt)
    : null;

  return (
    <div data-smart-hide className="mx-auto max-w-7xl px-4 pb-16 pt-6 lg:px-8">
      <JsonLd data={blogPosting(p, base, publisher)} />
      <div className="immersive-page" hidden aria-hidden />
      <ViewPing postId={p.id} />

      <header className="grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,52%)] lg:gap-12">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-yt-text2">
            {date && <span>{date}</span>}
            {p.readTime ? <span>• {t("post.minuteRead", { n: p.readTime })}</span> : null}
            <span>• {fmt.views(p.viewCount, p.type)}</span>
          </div>

          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {lp.title}
          </h1>

          {lp.excerpt && (
            <p className="mt-4 text-base leading-7 text-yt-text2 sm:text-lg">{lp.excerpt}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
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
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-yt-hover">
            {p.thumbnail && (
              <Image
                src={p.thumbnail}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 680px"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </header>

      <hr className="mx-auto mt-10 max-w-3xl border-t border-yt-outline" />

      <div className="mt-8">
        <div className="mx-auto max-w-3xl min-w-0">
          <div>
            <AdSlots pos="posTop" />
          </div>

          <article className="text-[17px] leading-8">
            <ArticleWithAd doc={doc} />
          </article>

          <div>
            <AdSlots pos="posBottom" />
          </div>

          {(prev || next) && (
            <nav className="mt-10 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/${prev.slug}`}
                  className="rounded-xl border border-yt-outline p-4 hover:bg-yt-hover"
                >
                  <span className="text-xs text-yt-text2">← {t("post.previous")}</span>
                  <span className="mt-1 line-clamp-2 block text-sm font-medium">{prev.title}</span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next && (
                <Link
                  href={`/${next.slug}`}
                  className="rounded-xl border border-yt-outline p-4 text-right hover:bg-yt-hover"
                >
                  <span className="text-xs text-yt-text2">{t("post.next")} →</span>
                  <span className="mt-1 line-clamp-2 block text-sm font-medium">{next.title}</span>
                </Link>
              )}
            </nav>
          )}

          <div className="mt-12 rounded-2xl border border-yt-outline bg-yt-raised p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-yt-text2">{t("post.aboutAuthor")}</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/@${p.author.username}`} className="flex items-center gap-3">
                <img
                  src={p.author.image ?? ""}
                  alt=""
                  className="h-12 w-12 rounded-full bg-yt-hover"
                />
                <span>
                  <span className="flex items-center gap-1 text-base font-medium">
                    {p.author.name}
                    {(p.author.role === "admin" || p.author.verified) && <CheckBadgeIcon />}
                  </span>
                  <span className="text-xs text-yt-text2">{t("post.author")}</span>
                </span>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <LikeButton
                  postId={p.id}
                  initialLikeCount={likeState.likeCount}
                  initialReaction={likeState.reaction}
                  disabled={!viewerId}
                />
                <ShareButton title={p.title} />
                <SavePlaylistButton postId={p.id} viewerId={viewerId} />
                <BookmarkButton postId={p.id} initialSaved={saved} disabled={!viewerId} />
              </div>
            </div>
          </div>

          <Comments postId={p.id} />

          {readNext.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-semibold">{t("post.readNext")}</h2>
              <div className="mt-4 card-grid">
                {readNext.map((r) => (
                  <VideoCard key={r.id} post={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Toc headings={headings} title={t("post.contents")} />
    </div>
  );
}
