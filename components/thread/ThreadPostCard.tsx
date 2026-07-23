import { MapPin } from "lucide-react";
import Link from "next/link";
import OgCard from "@/components/og/OgCard";
import RichText from "@/components/rte/RichText";
import { CheckBadgeIcon } from "@/components/shell/icons";
import type { ThreadPostRow } from "@/lib/threads";
import type { Fmt } from "@/lib/format";
import PollDisplay from "./PollDisplay";
import PostActions from "./PostActions";
import VoteButtons from "./VoteButtons";

type T = (key: string, params?: Record<string, string | number>) => string;

export function topicColor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) % 360;
  return `hsl(${h} 58% 55%)`;
}

export default function ThreadPostCard({
  post,
  t,
  fmt,
  canVote,
}: {
  post: ThreadPostRow;
  t: T;
  fmt: Fmt;
  canVote: boolean;
}) {
  const removed = post.removed;
  const cover = post.mediaUrls[0];
  const extra = post.mediaUrls.length - 1;
  const anon = post.ghost || !post.author.id;
  const name = anon ? t("thread.anon") : post.author.name;

  return (
    <article
      className="group flex gap-2 rounded-2xl border border-yt-outline bg-yt-raised p-2.5 transition-colors hover:border-yt-searchborder hover:bg-yt-hover/40 sm:gap-3 sm:p-3"
      style={
        post.color && !removed
          ? { background: `color-mix(in srgb, ${post.color} 9%, var(--yt-raised))` }
          : undefined
      }
    >
      <div className="pt-0.5">
        <VoteButtons
          targetType="post"
          targetId={post.id}
          score={post.score}
          myVote={post.myVote}
          canVote={canVote}
          orientation="vertical"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-yt-text2">
          {post.topic && (
            <Link
              href={`/threads/c/${post.topic.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-yt-chip px-2.5 py-0.5 font-semibold text-yt-text transition-colors hover:bg-yt-chip-hover"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: topicColor(post.topic.slug) }}
              />
              {post.topic.name}
            </Link>
          )}
          <span className="inline-flex items-center gap-1.5">
            {!anon && post.author.image ? (
              <img
                src={post.author.image}
                alt=""
                className="h-5 w-5 rounded-full bg-yt-hover object-cover"
              />
            ) : (
              <span
                className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white"
                style={{ background: topicColor(name) }}
              >
                {name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-medium text-yt-text">{name}</span>
            {!anon && post.author.verified && <CheckBadgeIcon width={13} height={13} />}
          </span>
          <span aria-hidden>·</span>
          <span suppressHydrationWarning>{fmt.ago(post.createdAt)}</span>
          {post.location && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin size={12} />
              {post.location}
            </span>
          )}
        </div>

        {removed ? (
          <p className="mt-1.5 text-lg font-semibold text-yt-text2">{t("thread.removed")}</p>
        ) : (
          <>
            {post.body && (
              <Link href={`/threads/p/${post.id}`} className="mt-1.5 block">
                <div className="relative max-h-44 overflow-hidden text-sm leading-relaxed text-yt-text">
                  <RichText value={post.body} />
                </div>
              </Link>
            )}

            {cover && (
              <Link
                href={`/threads/p/${post.id}`}
                className="relative mt-2.5 block overflow-hidden rounded-xl border border-yt-outline"
              >
                <img src={cover} alt="" className="max-h-96 w-full object-cover" />
                {extra > 0 && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
                    +{extra}
                  </span>
                )}
              </Link>
            )}

            {post.audioUrl && <audio src={post.audioUrl} controls className="mt-2.5 h-10 w-full" />}

            {post.poll && (
              <div className="mt-2.5">
                <PollDisplay
                  postId={post.id}
                  poll={post.poll}
                  counts={post.pollCounts}
                  myVote={post.pollMyVote}
                  canVote={canVote}
                />
              </div>
            )}

            {post.ogCard && (
              <div className="mt-2.5">
                <OgCard data={post.ogCard} />
              </div>
            )}

            <PostActions postId={post.id} commentCount={post.commentCount} className="mt-2.5" />
          </>
        )}
      </div>
    </article>
  );
}
