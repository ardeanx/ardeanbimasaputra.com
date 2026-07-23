import Image from "next/image";
import Link from "next/link";
import AdSlots from "@/components/ads/AdSlots";
import RenderDoc from "@/components/content/RenderDoc";
import type { DetailPost } from "@/components/detail/types";
import SavePlaylistButton from "@/components/playlist/SavePlaylistButton";
import JsonLd from "@/components/seo/JsonLd";
import { CheckBadgeIcon } from "@/components/shell/icons";
import SubscribeButton from "@/components/shell/SubscribeButton";
import Comments from "@/components/watch/Comments";
import DescriptionBox from "@/components/watch/DescriptionBox";
import LikeButton from "@/components/watch/LikeButton";
import MoreMenu from "@/components/watch/MoreMenu";
import RelatedCard from "@/components/watch/RelatedCard";
import ShareButton from "@/components/watch/ShareButton";
import VastPlayer from "@/components/watch/VastPlayer";
import VideoPlayer from "@/components/watch/VideoPlayer";
import ViewPing from "@/components/watch/ViewPing";
import { followerCount, isFollowing, postLikeState } from "@/lib/community";
import { prepareDoc } from "@/lib/content";
import { localizePost } from "@/lib/content-translation";
import { db } from "@/lib/db";
import { getFmt } from "@/lib/format-server";
import { getLocale, getT } from "@/lib/i18n";
import { videoObject } from "@/lib/jsonld";
import { baseUrl } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export default async function WatchView({
  post: p,
  viewerId,
}: {
  post: DetailPost;
  viewerId: string | null;
}) {
  const lp = await localizePost(p, await getLocale());
  const [t, fmt] = await Promise.all([getT(), getFmt()]);
  const { vast } = (await getSettings()).integrations;
  const base = baseUrl();

  const related = await db.query.post.findMany({
    where: (t, { and, eq, ne }) =>
      and(eq(t.status, "PUBLISHED"), eq(t.visibility, "PUBLIC"), ne(t.id, p.id)),
    with: { author: true },
    orderBy: (t, { desc }) => [desc(t.viewCount)],
    limit: 15,
  });
  const [doc, likeState, subCount, following] = await Promise.all([
    prepareDoc(lp.body),
    postLikeState(p.id, viewerId ?? undefined),
    followerCount(p.author.id),
    viewerId ? isFollowing(viewerId, p.author.id) : Promise.resolve(false),
  ]);

  return (
    <div className="watch-shell mx-auto flex max-w-[1720px] flex-col gap-6 pb-16 sm:px-4 sm:pt-6 lg:flex-row lg:px-6">
      <JsonLd data={videoObject(p, base)} />
      <div className="immersive-page" hidden aria-hidden />
      <ViewPing postId={p.id} />
      <div className="min-w-0 flex-1">
        <div className="overflow-x-clip sm:overflow-x-visible [&_.rounded-xl]:rounded-none sm:[&_.rounded-xl]:rounded-xl">
          {p.type === "VIDEO" && p.mediaUrl ? (
            vast.enabled && vast.tagUrl ? (
              <VastPlayer
                src={p.mediaUrl}
                poster={p.thumbnail ?? undefined}
                tagUrl={vast.tagUrl}
                skipAfterSec={vast.skipAfterSec}
                timeoutSec={vast.timeoutSec}
              />
            ) : (
              <VideoPlayer src={p.mediaUrl} poster={p.thumbnail} />
            )
          ) : p.type === "AUDIO" && p.mediaUrl ? (
            <div className="relative overflow-hidden rounded-xl bg-yt-hover">
              <div className="relative aspect-video">
                {p.thumbnail && (
                  <Image
                    src={p.thumbnail}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="object-cover"
                  />
                )}
              </div>
              <audio
                controls
                src={p.mediaUrl}
                className="absolute inset-x-4 bottom-3 w-[calc(100%-2rem)]"
              />
            </div>
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-yt-hover">
              {p.thumbnail && (
                <Image
                  src={p.thumbnail}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-cover"
                />
              )}
            </div>
          )}
        </div>

        <div className="relative -mt-3 rounded-t-2xl bg-yt-base px-4 pt-4 sm:mt-0 sm:rounded-none sm:bg-transparent sm:px-0 sm:pt-0">
          <AdSlots pos="posTop" />

          <h1 className="mt-3 text-xl font-bold leading-7">{lp.title}</h1>
          {lp.translatedLocale && (
            <span className="mt-2 inline-block rounded-full bg-yt-chip px-3 py-1 text-xs text-yt-text2">
              {t("post.autoTranslated")}
            </span>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-3">
            <Link href={`/@${p.author.username}`} className="flex items-center gap-3">
              <img
                src={p.author.image ?? ""}
                alt=""
                className="h-10 w-10 rounded-full bg-yt-hover"
              />
              <span>
                <span className="flex items-center gap-1 text-base font-medium">
                  {p.author.name}
                  {(p.author.role === "admin" || p.author.verified) && <CheckBadgeIcon />}
                </span>
                <span className="text-xs text-yt-text2">
                  {t("follow.followers", { n: fmt.compact(subCount) })}
                </span>
              </span>
            </Link>
            <div className="ml-2">
              <SubscribeButton
                targetUserId={p.author.id}
                viewerId={viewerId}
                initialFollowing={following}
                initialCount={subCount}
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <LikeButton
                postId={p.id}
                initialLikeCount={likeState.likeCount}
                initialReaction={likeState.reaction}
                disabled={!viewerId}
              />
              <ShareButton title={p.title} />
              <SavePlaylistButton postId={p.id} viewerId={viewerId} />
              <MoreMenu postId={p.id} mediaUrl={p.mediaUrl ?? null} title={p.title} />
            </div>
          </div>

          <DescriptionBox
            thumbnail={p.thumbnail}
            meta={`${fmt.views(p.viewCount, p.type)} • ${fmt.ago(p.publishedAt)}${
              p.category ? ` • #${p.category.name}` : ""
            }`}
          >
            <div className="text-[15px] leading-7">
              <RenderDoc doc={doc} />
            </div>
          </DescriptionBox>

          <AdSlots pos="posBottom" />

          <Comments postId={p.id} />
        </div>
      </div>

      <aside className="w-full shrink-0 px-4 sm:px-0 lg:w-[402px]">
        <div className="flex flex-col gap-2">
          {related.map((r) => (
            <RelatedCard
              key={r.id}
              href={`/${r.slug}`}
              thumbnail={r.thumbnail}
              title={r.title}
              authorName={r.author.name}
              metaLine={`${fmt.views(r.viewCount, r.type)} • ${fmt.ago(r.publishedAt)}`}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
