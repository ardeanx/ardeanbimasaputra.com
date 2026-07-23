import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import AnalyticsPanel from "@/components/studio/AnalyticsPanel";
import StudioTabs from "@/components/studio/StudioTabs";
import { comment, like, post } from "@/db/schema";
import { followerCount } from "@/lib/community";
import { db } from "@/lib/db";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioDashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const session = await getSession();
  const user = session!.user as { id: string; role?: string | null };
  const isAdmin = user.role === "admin";
  const t = await getT();
  const tabs = [
    { key: "ringkasan", label: t("studio.dash.tabOverview") },
    { key: "analitik", label: t("studio.dash.tabAnalytics") },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-4 text-2xl font-semibold">{t("studio.dash.title")}</h1>
      <StudioTabs tabs={tabs} param="view" />
      {view === "analitik" ? (
        <AnalyticsPanel userId={user.id} isAdmin={isAdmin} />
      ) : (
        <Overview userId={user.id} isAdmin={isAdmin} />
      )}
    </div>
  );
}

async function Overview({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const t = await getT();
  const fmt = await getFmt();
  const user = { id: userId };
  const scope = isAdmin ? undefined : eq(post.authorId, user.id);
  const pubScope = isAdmin
    ? eq(post.status, "PUBLISHED")
    : and(eq(post.status, "PUBLISHED"), eq(post.authorId, user.id));

  const [latest, top, totals, pendingRow, subs] = await Promise.all([
    db.query.post.findFirst({
      where: scope,
      orderBy: [desc(post.updatedAt)],
      with: { category: true },
    }),
    db.query.post.findMany({
      where: pubScope,
      orderBy: [desc(post.viewCount)],
      limit: 5,
    }),
    db
      .select({
        count: count(),
        views: sql<number>`coalesce(sum(${post.viewCount}), 0)::int`,
      })
      .from(post)
      .where(pubScope)
      .then((r) => r[0]),
    db
      .select({ n: count() })
      .from(post)
      .where(
        isAdmin
          ? eq(post.status, "REVIEW")
          : and(eq(post.authorId, user.id), inArray(post.status, ["DRAFT", "REVIEW"])),
      )
      .then((r) => r[0]),
    followerCount(user.id),
  ]);

  const pending = pendingRow?.n ?? 0;
  const [latestComments, latestLikes] = latest
    ? await Promise.all([
        db
          .select({ n: count() })
          .from(comment)
          .where(eq(comment.postId, latest.id))
          .then((r) => r[0]?.n ?? 0),
        db
          .select({ n: count() })
          .from(like)
          .where(eq(like.postId, latest.id))
          .then((r) => r[0]?.n ?? 0),
      ])
    : [0, 0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card title={t("studio.dash.latestPerf")} className="xl:row-span-2">
        {latest ? (
          <div>
            <span className="mb-3 block aspect-video w-full overflow-hidden rounded-lg bg-yt-hover">
              {latest.thumbnail && (
                <img src={latest.thumbnail} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <p className="line-clamp-2 text-sm font-medium">{latest.title}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-yt-outline pt-4 text-center">
              <Metric label={t("studio.metric.views")} value={fmt.compact(latest.viewCount)} />
              <Metric label={t("studio.metric.comments")} value={fmt.compact(latestComments)} />
              <Metric label={t("studio.metric.likes")} value={fmt.compact(latestLikes)} />
            </div>
            <Link
              href={`/studio/${latest.id}`}
              className="mt-4 block text-sm font-medium text-yt-cta"
            >
              {t("studio.dash.manage")}
            </Link>
          </div>
        ) : (
          <Empty>{t("studio.dash.empty")}</Empty>
        )}
      </Card>

      <Card title={isAdmin ? t("studio.dash.pendingModTitle") : t("studio.dash.yourStatusTitle")}>
        <p className="text-4xl font-semibold">{fmt.compact(pending)}</p>
        <p className="mt-1 text-sm text-yt-text2">
          {isAdmin ? t("studio.dash.awaitingReview") : t("studio.dash.draftAwaiting")}
        </p>
        <Link
          href={isAdmin ? "/studio/moderation" : "/studio/content"}
          className="mt-4 inline-block text-sm font-medium text-yt-cta"
        >
          {isAdmin ? t("studio.dash.openQueue") : t("studio.dash.viewContent")}
        </Link>
      </Card>

      <Card title={t("studio.dash.analytics")}>
        <p className="text-xs text-yt-text2">{t("studio.dash.totalFollowers")}</p>
        <p className="text-3xl font-semibold">{fmt.compact(subs)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-yt-outline pt-4">
          <Metric label={t("studio.dash.published")} value={fmt.compact(totals?.count ?? 0)} />
          <Metric label={t("studio.metric.totalViews")} value={fmt.compact(totals?.views ?? 0)} />
        </div>
      </Card>

      <Card title={t("studio.dash.top")}>
        {top.length === 0 ? (
          <Empty>{t("studio.dash.emptyPublished")}</Empty>
        ) : (
          <ul className="space-y-3">
            {top.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="block aspect-video w-16 shrink-0 overflow-hidden rounded bg-yt-hover">
                  {p.thumbnail && (
                    <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/studio/${p.id}`}
                    className="line-clamp-1 text-sm font-medium hover:text-yt-cta"
                  >
                    {p.title}
                  </Link>
                  <span className="text-xs text-yt-text2">{fmt.views(p.viewCount, p.type)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={t("studio.dash.welcome")}>
        <p className="text-sm text-yt-text2">{t("studio.dash.welcomeBody")}</p>
        <Link
          href="/studio/new"
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-yt-cta px-4 text-sm font-medium text-yt-cta-text"
        >
          {t("studio.dash.createNew")}
        </Link>
      </Card>
    </div>
  );
}

function Card({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-yt-outline bg-yt-raised p-4 ${className ?? ""}`}>
      <h2 className="mb-3 text-sm font-medium text-yt-text2">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-yt-text2">{label}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-yt-text2">{children}</p>;
}
