import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ZoomImg from "@/components/content/ZoomImg";
import OgCard from "@/components/og/OgCard";
import RichText from "@/components/rte/RichText";
import { CheckBadgeIcon } from "@/components/shell/icons";
import CommentComposer from "@/components/thread/CommentComposer";
import PollDisplay from "@/components/thread/PollDisplay";
import PostActions from "@/components/thread/PostActions";
import ThreadCommentTree from "@/components/thread/ThreadCommentTree";
import { topicColor } from "@/components/thread/ThreadPostCard";
import VoteButtons from "@/components/thread/VoteButtons";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { getThreadPost, listThreadComments } from "@/lib/threads";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getThreadPost(id);
  const t = await getT();
  if (!post || post.removed) return { title: t("meta.notFound") };
  const description = post.body?.slice(0, 160) ?? undefined;
  const url = `/threads/p/${id}`;
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description, url, type: "article" },
  };
}

export default async function ThreadPostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  const fmt = await getFmt();
  const session = await getSession();
  const settings = await getSettings();
  const viewerId = session?.user.id ?? null;
  const siteKey = settings.integrations.turnstile.enabled
    ? settings.integrations.turnstile.siteKey
    : null;

  const post = await getThreadPost(id, viewerId);
  if (!post) notFound();

  const comments = await listThreadComments(id, viewerId);
  const canVote = Boolean(session);
  const anon = post.ghost || !post.author.id;
  const authorName = anon ? t("thread.anon") : post.author.name;

  return (
    <div
      className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
      style={
        post.color && !post.removed
          ? { background: `color-mix(in srgb, ${post.color} 5%, var(--yt-base))` }
          : undefined
      }
    >
      <nav className="mb-4 text-sm text-yt-text2">
        <Link href="/threads" className="transition-colors hover:text-yt-text">
          {t("nav.threads")}
        </Link>
        {post.topic && (
          <>
            <span className="mx-1.5">/</span>
            <Link
              href={`/threads/c/${post.topic.slug}`}
              className="transition-colors hover:text-yt-text"
            >
              {post.topic.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <article
            className="flex gap-3 rounded-2xl border border-yt-outline bg-yt-raised p-4"
            style={
              post.color && !post.removed
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
                      style={{ background: topicColor(authorName) }}
                    >
                      {authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium text-yt-text">{authorName}</span>
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

              {post.removed ? (
                <h1 className="mt-2 text-2xl font-bold leading-tight text-yt-text2">
                  {t("thread.removed")}
                </h1>
              ) : (
                <>
                  {post.body && (
                    <div className="mt-3 text-[15px] text-yt-text">
                      <RichText value={post.body} />
                    </div>
                  )}

                  {post.mediaUrls.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {post.mediaUrls.map((src) => (
                        <ZoomImg
                          key={src}
                          src={src}
                          className="w-full rounded-xl border border-yt-outline object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {post.audioUrl && (
                    <audio src={post.audioUrl} controls className="mt-3 h-10 w-full" />
                  )}

                  {post.poll && (
                    <div className="mt-3">
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
                    <div className="mt-3">
                      <OgCard data={post.ogCard} />
                    </div>
                  )}

                  <PostActions postId={post.id} commentCount={post.commentCount} className="mt-4" />
                </>
              )}
            </div>
          </article>

          <section className="mt-6">
            <h2 className="mb-3 text-base font-bold">
              {t("thread.commentsHeading")}
              <span className="ml-2 text-sm font-medium text-yt-text2">{post.commentCount}</span>
            </h2>
            <CommentComposer
              postId={post.id}
              parentId={null}
              siteKey={siteKey}
              isLoggedIn={Boolean(session)}
              variant="root"
            />
            <div className="mt-4">
              <ThreadCommentTree
                comments={comments}
                canVote={canVote}
                siteKey={siteKey}
                isLoggedIn={Boolean(session)}
              />
            </div>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border border-yt-outline bg-yt-raised p-4">
            <h2 className="mb-3 text-sm font-semibold">{t("thread.communities")}</h2>
            {post.topic ? (
              <Link
                href={`/threads/c/${post.topic.slug}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-yt-hover"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                  style={{ background: topicColor(post.topic.slug) }}
                >
                  {post.topic.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-yt-text">
                  {post.topic.name}
                </span>
              </Link>
            ) : (
              <Link
                href="/threads"
                className="block rounded-xl px-2 py-2 text-sm text-yt-text2 transition-colors hover:bg-yt-hover hover:text-yt-text"
              >
                {t("nav.threads")}
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
