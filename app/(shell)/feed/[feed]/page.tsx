import { Bookmark, Clock, Heart, Users } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import VideoCard, { type CardData } from "@/components/cards/VideoCard";
import ComingSoon from "@/components/shell/ComingSoon";
import EmptyState from "@/components/ui/EmptyState";
import { historyFeed, likedFeed, subscriptionFeed } from "@/lib/community";
import { getT } from "@/lib/i18n";
import { listUserPlaylists } from "@/lib/playlists";
import { getSession } from "@/lib/session";

type FeedCfg = {
  titleKey: string;
  fn?: (userId: string) => Promise<CardData[]>;
  emptyKey: string;
  icon: ReactNode;
};

const FEEDS: Record<string, FeedCfg> = {
  subscriptions: {
    titleKey: "nav.following",
    fn: subscriptionFeed,
    emptyKey: "feed.subsEmpty",
    icon: <Users />,
  },
  history: {
    titleKey: "nav.history",
    fn: historyFeed,
    emptyKey: "feed.historyEmpty",
    icon: <Clock />,
  },
  liked: {
    titleKey: "feed.likedTitle",
    fn: likedFeed,
    emptyKey: "feed.likedEmpty",
    icon: <Heart />,
  },
  playlist: {
    titleKey: "nav.saved",
    emptyKey: "feed.savedEmpty",
    icon: <Bookmark />,
  },
};

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default async function Feed({ params }: { params: Promise<{ feed: string }> }) {
  const { feed } = await params;
  const cfg = FEEDS[feed];
  if (!cfg) notFound();
  const t = await getT();

  if (feed === "playlist") {
    const session = await getSession();
    if (!session)
      return (
        <EmptyState
          icon={<Bookmark />}
          title={t("nav.saved")}
          description={t("feed.signInSaved")}
          action={{ label: t("header.signIn"), href: "/?signin=1" }}
        />
      );
    const playlists = await listUserPlaylists(session.user.id);
    return (
      <div className="mx-auto max-w-3xl px-6 py-6">
        <h1 className="mb-6 text-2xl font-semibold">{t("nav.saved")}</h1>
        {playlists.length === 0 ? (
          <EmptyState
            icon={<Bookmark />}
            title={t("nav.saved")}
            description={t("feed.savedEmpty")}
            action={{ label: t("nav.explore"), href: "/" }}
          />
        ) : (
          <ul className="space-y-2">
            {playlists.map((pl) => (
              <li key={pl.id}>
                <Link
                  href={`/playlist/${pl.id}`}
                  className="flex items-center justify-between rounded-xl border border-yt-outline p-3 hover:bg-yt-hover"
                >
                  <span className="line-clamp-1 font-medium">{pl.title}</span>
                  <span className="shrink-0 text-xs text-yt-text2">
                    {t("channel.contentCount", { n: pl.count })} ·{" "}
                    {pl.visibility === "PRIVATE" ? t("playlist.private") : t("playlist.public")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!cfg.fn) return <ComingSoon title={t(cfg.titleKey)} icon={cfg.icon} />;

  const session = await getSession();
  if (!session)
    return (
      <EmptyState
        icon={cfg.icon}
        title={t(cfg.titleKey)}
        description={t("feed.signInToView")}
        action={{ label: t("header.signIn"), href: "/?signin=1" }}
      />
    );

  const posts = await cfg.fn(session.user.id);
  if (posts.length === 0)
    return (
      <EmptyState
        icon={cfg.icon}
        title={t(cfg.titleKey)}
        description={t(cfg.emptyKey)}
        action={{ label: t("nav.explore"), href: "/" }}
      />
    );

  return (
    <div className="mx-auto max-w-[1720px] px-4 pb-16 pt-4 lg:px-6">
      <h1 className="mb-6 text-xl font-semibold">{t(cfg.titleKey)}</h1>
      <div className="card-grid">
        {posts.map((p) => (
          <VideoCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
