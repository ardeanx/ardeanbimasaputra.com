import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ThreadPostCard, { topicColor } from "@/components/thread/ThreadPostCard";
import ThreadComposer from "@/components/thread/ThreadComposer";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { getTopicBySlug, listThreadPosts } from "@/lib/threads";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) return { title: (await getT())("meta.notFound") };
  const description = topic.description?.slice(0, 160) ?? undefined;
  const url = `/threads/c/${slug}`;
  return {
    title: topic.name,
    description,
    alternates: { canonical: url },
    openGraph: { title: topic.name, description, url, type: "article" },
  };
}

export default async function TopicFeed({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const t = await getT();
  const fmt = await getFmt();
  const session = await getSession();
  const settings = await getSettings();
  const viewerId = session?.user.id ?? null;
  const siteKey = settings.integrations.turnstile.enabled
    ? settings.integrations.turnstile.siteKey
    : null;

  const posts = await listThreadPosts({ topicSlug: slug, viewerId });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <nav className="mb-4 text-sm text-yt-text2">
        <Link href="/threads" className="transition-colors hover:text-yt-text">
          {t("nav.threads")}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-yt-text">{topic.name}</span>
      </nav>

      <div className="mb-6 overflow-hidden rounded-2xl border border-yt-outline bg-yt-raised">
        <div
          className="h-16"
          style={{
            background: `linear-gradient(90deg, ${
              topic.color ?? topicColor(topic.slug)
            }, transparent)`,
          }}
        />
        <div className="flex items-start gap-4 p-5 pt-0">
          <span
            className="-mt-7 grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white ring-4 ring-yt-raised"
            style={{ background: topic.color ?? topicColor(topic.slug) }}
          >
            {topic.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 pt-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">{topic.name}</h1>
                <p className="mt-0.5 text-xs font-medium text-yt-text2">
                  {t("thread.postsCount", { n: topic.postCount })}
                </p>
              </div>
              <ThreadComposer
                topics={[{ slug: topic.slug, name: topic.name }]}
                siteKey={siteKey}
                isLoggedIn={Boolean(session)}
                avatarUrl={session?.user.image ?? null}
                userName={session?.user.name ?? null}
              />
            </div>
            {topic.description && (
              <p className="mt-2 text-sm leading-relaxed text-yt-text2">{topic.description}</p>
            )}
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-yt-text2">{t("thread.noPosts")}</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <ThreadPostCard key={p.id} post={p} t={t} fmt={fmt} canVote={Boolean(session)} />
          ))}
        </div>
      )}
    </div>
  );
}
