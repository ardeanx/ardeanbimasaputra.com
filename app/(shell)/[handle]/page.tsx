import type { Metadata } from "next";
import { FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import VideoCard from "@/components/cards/VideoCard";
import RenderDoc from "@/components/content/RenderDoc";
import PostArticle from "@/components/detail/PostArticle";
import ResourceView from "@/components/detail/ResourceView";
import WatchView from "@/components/detail/WatchView";
import { CheckBadgeIcon } from "@/components/shell/icons";
import SubscribeButton from "@/components/shell/SubscribeButton";
import EmptyState from "@/components/ui/EmptyState";
import { followerCount, isFollowing } from "@/lib/community";
import { prepareDoc } from "@/lib/content";
import { localizePost } from "@/lib/content-translation";
import { db } from "@/lib/db";
import { bodyText } from "@/lib/format";
import { getFmt } from "@/lib/format-server";
import { getLocale, getT } from "@/lib/i18n";
import { getPublishedPage } from "@/lib/pages";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "beranda", labelKey: "nav.home" },
  { key: "postingan", labelKey: "channel.tabPosts" },
  { key: "resource", labelKey: "nav.resources" },
  { key: "tentang", labelKey: "footer.about" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

async function findPublishedPost(slug: string) {
  return db.query.post.findFirst({
    where: (t, { and, eq }) => and(eq(t.slug, slug), eq(t.status, "PUBLISHED")),
    with: { author: true, category: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);
  const t = await getT();

  if (!decoded.startsWith("@")) {
    const p = await findPublishedPost(decoded);
    if (p) {
      if (p.visibility === "PRIVATE") return { title: t("meta.notFound") };
      const lp = await localizePost(p, await getLocale());
      const canonical = p.canonicalUrl ?? `/${p.slug}`;
      const noindex = p.noindex || p.visibility === "UNLISTED";
      if (p.type === "VIDEO" || p.type === "AUDIO") {
        const description =
          bodyText(lp.body).slice(0, 160) || t("meta.contentBy", { name: p.author.name });
        const og = `/api/og?v=${p.id}`;
        return {
          title: lp.title,
          description,
          robots: noindex ? { index: false, follow: false } : undefined,
          alternates: { canonical },
          openGraph: {
            title: lp.title,
            description,
            url: canonical,
            type: "article",
            images: [{ url: og, width: 1200, height: 630 }],
          },
          twitter: {
            card: "summary_large_image",
            title: lp.title,
            description,
            images: [og],
          },
        };
      }
      const title = lp.seoTitle ?? lp.title;
      const description =
        lp.seoDescription ??
        lp.excerpt ??
        (bodyText(lp.body).slice(0, 160) || t("meta.contentBy", { name: p.author.name }));
      const og = p.ogImage ?? p.thumbnail ?? `/api/og?v=${p.id}`;
      return {
        title,
        description,
        robots: noindex ? { index: false, follow: false } : undefined,
        alternates: { canonical },
        openGraph: {
          title,
          description,
          url: canonical,
          type: "article",
          images: [{ url: og, width: 1200, height: 630 }],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [og],
        },
      };
    }

    const page = await getPublishedPage(decoded);
    if (!page) return { title: t("meta.pageNotFound") };
    const title = page.seoTitle ?? page.title;
    const description = page.seoDescription ?? undefined;
    return {
      title,
      description,
      alternates: { canonical: `/${page.slug}` },
      openGraph: {
        title,
        description,
        type: "article",
        images: page.ogImage ? [page.ogImage] : undefined,
      },
    };
  }

  const u = await db.query.user.findFirst({
    where: (t, { eq }) => eq(t.username, decoded.slice(1)),
  });
  if (!u) return { title: t("profile.notFound") };
  const description = u.bio ?? t("profile.metaBio", { name: u.name });
  return {
    title: u.name,
    description,
    alternates: { canonical: `/@${u.username}` },
    openGraph: { title: u.name, description, type: "profile" },
  };
}

export default async function Channel({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ handle }, { tab }] = await Promise.all([params, searchParams]);
  const decoded = decodeURIComponent(handle);
  const t = await getT();
  const fmt = await getFmt();

  if (!decoded.startsWith("@")) {
    const p = await findPublishedPost(decoded);
    if (p) {
      const session = await getSession();
      const viewerId = session?.user.id ?? null;
      const viewerRole = (session?.user as { role?: string | null } | undefined)?.role ?? null;
      if (p.visibility === "PRIVATE" && p.authorId !== viewerId && viewerRole !== "admin")
        notFound();

      if (p.type === "POST") return <PostArticle post={p} viewerId={viewerId} />;
      if (p.type === "RESOURCE") return <ResourceView post={p} viewerId={viewerId} />;
      return <WatchView post={p} viewerId={viewerId} />;
    }

    const staticPage = await getPublishedPage(decoded);
    if (!staticPage) notFound();
    const doc = await prepareDoc(staticPage.body);
    return (
      <article className="mx-auto max-w-3xl px-6 pb-16 pt-10">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">{staticPage.title}</h1>
        <RenderDoc doc={doc} />
      </article>
    );
  }

  const u = await db.query.user.findFirst({
    where: (t, { eq }) => eq(t.username, decoded.slice(1)),
  });
  if (!u) notFound();

  const active: TabKey = TABS.some((x) => x.key === tab) ? (tab as TabKey) : "beranda";

  const posts = await db.query.post.findMany({
    where: (p, { and, eq }) =>
      and(eq(p.status, "PUBLISHED"), eq(p.visibility, "PUBLIC"), eq(p.authorId, u.id)),
    with: { author: true },
    orderBy: (p, { desc }) => [desc(p.publishedAt)],
  });

  const session = await getSession();
  const viewerId = session?.user.id ?? null;
  const [subs, following] = await Promise.all([
    followerCount(u.id),
    viewerId ? isFollowing(viewerId, u.id) : Promise.resolve(false),
  ]);

  const shown =
    active === "postingan"
      ? posts.filter((p) => p.type === "POST")
      : active === "resource"
        ? posts.filter((p) => p.type === "RESOURCE")
        : posts;

  const totalViews = posts.reduce((sum, p) => sum + p.viewCount, 0);

  return (
    <div className="mx-auto max-w-[1284px] px-6 pb-16">
      <div className="mt-4 aspect-[6.2/1] overflow-hidden rounded-2xl bg-gradient-to-r from-[#065fd4] via-[#3ea6ff] to-[#065fd4]">
        {u.banner && <img src={u.banner} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <img
          src={u.image ?? ""}
          alt=""
          className="h-32 w-32 shrink-0 rounded-full bg-yt-hover sm:h-40 sm:w-40"
        />
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl">
            {u.name}
            {(u.role === "admin" || u.verified) && <CheckBadgeIcon width={18} height={18} />}
          </h1>
          <p className="mt-2 text-sm text-yt-text2">
            @{u.username} • {t("follow.followers", { n: fmt.compact(subs) })} •{" "}
            {t("channel.contentCount", { n: posts.length })}
          </p>
          {u.bio && <p className="mt-1 line-clamp-1 max-w-xl text-sm text-yt-text2">{u.bio}</p>}
          <div className="mt-3">
            <SubscribeButton
              targetUserId={u.id}
              viewerId={viewerId}
              initialFollowing={following}
              initialCount={subs}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-6 border-b border-yt-outline text-[15px] font-medium text-yt-text2">
        {TABS.map((tb) => (
          <Link
            key={tb.key}
            href={tb.key === "beranda" ? `/@${u.username}` : `/@${u.username}?tab=${tb.key}`}
            className={`pb-2 ${
              active === tb.key ? "border-b-2 border-yt-text text-yt-text" : "hover:text-yt-text"
            }`}
          >
            {t(tb.labelKey)}
          </Link>
        ))}
      </div>

      {active === "tentang" ? (
        <div className="mt-6 max-w-2xl">
          <h2 className="text-lg font-semibold">{t("footer.about")}</h2>
          <p className="mt-3 whitespace-pre-line text-sm">{u.bio ?? t("channel.noDescription")}</p>
          <h2 className="mt-8 text-lg font-semibold">{t("channel.stats")}</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between border-b border-yt-outline pb-2">
              <dt className="text-yt-text2">{t("channel.followers")}</dt>
              <dd>{fmt.compact(subs)}</dd>
            </div>
            <div className="flex justify-between border-b border-yt-outline pb-2">
              <dt className="text-yt-text2">{t("channel.content")}</dt>
              <dd>{posts.length}</dd>
            </div>
            <div className="flex justify-between border-b border-yt-outline pb-2">
              <dt className="text-yt-text2">{t("channel.totalViews")}</dt>
              <dd>{fmt.compact(totalViews)}</dd>
            </div>
            <div className="flex justify-between border-b border-yt-outline pb-2">
              <dt className="text-yt-text2">{t("channel.joined")}</dt>
              <dd>
                {new Intl.DateTimeFormat(await getLocale(), {
                  dateStyle: "long",
                }).format(u.createdAt)}
              </dd>
            </div>
          </dl>
        </div>
      ) : shown.length === 0 ? (
        <EmptyState icon={<FileText />} title={t("channel.emptyTab")} />
      ) : (
        <div className="mt-6 card-grid">
          {shown.map((p) => (
            <VideoCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
