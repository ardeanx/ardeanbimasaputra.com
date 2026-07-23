import type { Metadata } from "next";
import { MessagesSquare, Users } from "lucide-react";
import Link from "next/link";
import ThreadPostCard, { topicColor } from "@/components/thread/ThreadPostCard";
import ThreadComposer from "@/components/thread/ThreadComposer";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { listThreadPosts, listTopics } from "@/lib/threads";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("nav.threads"),
    description: t("thread.tagline"),
    alternates: { canonical: "/threads" },
  };
}

const SORTS = ["hot", "new", "top"] as const;
type Sort = (typeof SORTS)[number];

export default async function ThreadsFeed({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: rawSort } = await searchParams;
  const sort: Sort = SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : "hot";
  const t = await getT();
  const fmt = await getFmt();
  const session = await getSession();
  const settings = await getSettings();
  const viewerId = session?.user.id ?? null;
  const siteKey = settings.integrations.turnstile.enabled
    ? settings.integrations.turnstile.siteKey
    : null;

  const [posts, topics] = await Promise.all([listThreadPosts({ sort, viewerId }), listTopics()]);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">{t("nav.threads")}</h1>
        <p className="mt-1 text-sm text-yt-text2">{t("thread.tagline")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <div className="mb-4">
            <ThreadComposer
              topics={topics.map((x) => ({ slug: x.slug, name: x.name }))}
              siteKey={siteKey}
              isLoggedIn={Boolean(session)}
              variant="bar"
              avatarUrl={session?.user.image ?? null}
              userName={session?.user.name ?? null}
            />
          </div>

          <div className="mb-4 inline-flex items-center gap-1 rounded-full bg-yt-chip p-1">
            {SORTS.map((s) => (
              <Link
                key={s}
                href={s === "hot" ? "/threads" : `/threads?sort=${s}`}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  s === sort
                    ? "bg-yt-base text-yt-text shadow-sm"
                    : "text-yt-text2 hover:text-yt-text"
                }`}
              >
                {t(`thread.sort.${s}`)}
              </Link>
            ))}
          </div>

          {posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-yt-outline py-20 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-yt-chip text-yt-text2">
                <MessagesSquare size={26} />
              </span>
              <p className="text-sm text-yt-text2">{t("thread.noPosts")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <ThreadPostCard key={p.id} post={p} t={t} fmt={fmt} canVote={Boolean(session)} />
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-2xl border border-yt-outline bg-yt-raised p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Users size={16} className="text-yt-text2" />
              {t("thread.communities")}
            </h2>
            {topics.length === 0 ? (
              <p className="text-xs text-yt-text2">{t("thread.noTopics")}</p>
            ) : (
              <ul className="space-y-0.5">
                {topics.map((topic) => (
                  <li key={topic.id}>
                    <Link
                      href={`/threads/c/${topic.slug}`}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-yt-hover"
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                        style={{ background: topic.color ?? topicColor(topic.slug) }}
                      >
                        {topic.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-yt-text">
                          {topic.name}
                        </span>
                        <span className="block text-xs text-yt-text2">
                          {t("thread.postsCount", { n: topic.postCount })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
