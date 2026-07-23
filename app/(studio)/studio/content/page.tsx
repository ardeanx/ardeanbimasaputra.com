import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { Flag, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
import { PlusIcon } from "@/components/shell/icons";
import CategoriesManager from "@/components/studio/admin/CategoriesManager";
import QnaModeration from "@/components/studio/admin/QnaModeration";
import ReportsList from "@/components/studio/admin/ReportsList";
import ThreadModeration from "@/components/studio/admin/ThreadModeration";
import ContentTable, { type ContentRow } from "@/components/studio/content/ContentTable";
import StudioTabs from "@/components/studio/StudioTabs";
import EmptyState from "@/components/ui/EmptyState";
import { category, comment, post, threadPost, threadTopic, user } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { listQuestions } from "@/lib/qna";
import { listReports } from "@/lib/reports";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; view?: string }>;
}) {
  const { q, tab, view } = await searchParams;
  const session = await getSession();
  const isAdmin = (session!.user as { role?: string | null }).role === "admin";
  const active =
    isAdmin && (view === "kategori" || view === "threads" || view === "reports" || view === "qna")
      ? view
      : "konten";
  const t = await getT();
  const tabs = [
    { key: "konten", label: t("studio.content.tabContent") },
    { key: "kategori", label: t("studio.content.tabCategory") },
    { key: "threads", label: t("studio.content.tabThreads") },
    { key: "reports", label: t("studio.content.tabReports") },
    { key: "qna", label: t("studio.content.tabQna") },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("studio.content.title")}</h1>
        {active === "konten" && (
          <Link
            href="/studio/new"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-yt-cta px-4 text-sm font-medium text-yt-cta-text"
          >
            <PlusIcon width={20} height={20} /> {t("studio.content.create")}
          </Link>
        )}
      </div>

      {isAdmin && <StudioTabs tabs={tabs} param="view" />}

      {active === "kategori" ? (
        <CategoriesPanel />
      ) : active === "threads" ? (
        <ThreadsPanel />
      ) : active === "reports" ? (
        <ReportsPanel />
      ) : active === "qna" ? (
        <QnaPanel />
      ) : (
        <ContentPanel isAdmin={isAdmin} authorId={session!.user.id} q={q} tab={tab} />
      )}
    </div>
  );
}

async function ContentPanel({
  isAdmin,
  authorId,
  q,
  tab,
}: {
  isAdmin: boolean;
  authorId: string;
  q?: string;
  tab?: string;
}) {
  const rows = await db.query.post.findMany({
    where: isAdmin ? undefined : eq(post.authorId, authorId),
    with: { author: { columns: { name: true } } },
    orderBy: [desc(post.updatedAt)],
  });

  const ids = rows.map((r) => r.id);
  const counts = ids.length
    ? await db
        .select({ postId: comment.postId, n: count() })
        .from(comment)
        .where(inArray(comment.postId, ids))
        .groupBy(comment.postId)
    : [];
  const countMap = new Map(counts.map((c) => [c.postId, Number(c.n)]));

  const data: ContentRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    thumbnail: r.thumbnail,
    type: r.type,
    status: r.status,
    visibility: r.visibility,
    viewCount: r.viewCount,
    commentCount: countMap.get(r.id) ?? 0,
    updatedAt: r.updatedAt.toISOString(),
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    authorName: isAdmin ? r.author.name : null,
  }));

  const t = await getT();

  return (
    <>
      <p className="mb-4 -mt-2 text-sm text-yt-text2">
        {isAdmin ? t("studio.content.subAll") : t("studio.content.subOwn")}
      </p>
      {data.length === 0 ? (
        <EmptyState
          icon={<PlusIcon width={28} height={28} />}
          title={t("studio.content.empty")}
          description={t("empty.content.desc")}
          action={{ label: t("studio.content.create"), href: "/studio/new" }}
        />
      ) : (
        <ContentTable rows={data} initialTab={tab ?? "ALL"} initialQuery={q ?? ""} />
      )}
    </>
  );
}

async function CategoriesPanel() {
  const rows = await db.query.category.findMany({
    orderBy: [asc(category.name)],
  });

  const counts = await db
    .select({ categoryId: post.categoryId, n: count() })
    .from(post)
    .groupBy(post.categoryId);
  const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.n)]));

  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    postCount: countMap.get(r.id) ?? 0,
  }));

  const t = await getT();

  return (
    <div className="max-w-3xl">
      <p className="mb-6 -mt-2 text-sm text-yt-text2">{t("studio.content.categoryHint")}</p>
      <CategoriesManager categories={data} />
    </div>
  );
}

async function ThreadsPanel() {
  const rows = await db
    .select({
      id: threadPost.id,
      title: threadPost.title,
      authorName: threadPost.authorName,
      userName: user.name,
      topicName: threadTopic.name,
      score: threadPost.score,
      commentCount: threadPost.commentCount,
      removed: threadPost.removed,
      createdAt: threadPost.createdAt,
    })
    .from(threadPost)
    .leftJoin(threadTopic, eq(threadPost.topicId, threadTopic.id))
    .leftJoin(user, eq(threadPost.authorId, user.id))
    .orderBy(desc(threadPost.createdAt))
    .limit(100);

  const posts = rows.map((r) => ({
    id: r.id,
    title: r.title,
    authorName: r.userName ?? r.authorName,
    topicName: r.topicName,
    score: r.score,
    commentCount: r.commentCount,
    removed: r.removed,
    createdAt: r.createdAt.toISOString(),
  }));

  const t = await getT();

  return (
    <>
      <p className="mb-6 -mt-2 text-sm text-yt-text2">{t("studio.threads.sub")}</p>
      <ThreadModeration posts={posts} />
    </>
  );
}

async function ReportsPanel() {
  const reports = await listReports();
  const data = reports.map((r) => ({
    id: r.id,
    reason: r.reason,
    detail: r.detail,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    post: r.post,
    reporterName: r.reporterName,
  }));

  const t = await getT();

  return (
    <>
      <p className="mb-6 -mt-2 text-sm text-yt-text2">{t("studio.content.subReports")}</p>
      {data.length === 0 ? (
        <EmptyState icon={<Flag />} title={t("studio.content.reportsEmpty")} />
      ) : (
        <ReportsList reports={data} />
      )}
    </>
  );
}

async function QnaPanel() {
  const questions = await listQuestions({ sort: "newest", limit: 100 });
  const data = questions.map((q) => ({
    id: q.id,
    title: q.title,
    authorName: q.author.name,
    score: q.score,
    answerCount: q.answerCount,
    viewCount: q.viewCount,
    closed: q.closed,
    createdAt: q.createdAt,
  }));

  const t = await getT();

  return (
    <>
      <p className="mb-6 -mt-2 text-sm text-yt-text2">{t("studio.content.subQna")}</p>
      {data.length === 0 ? (
        <EmptyState icon={<MessageCircleQuestion />} title={t("studio.content.qnaEmpty")} />
      ) : (
        <QnaModeration questions={data} />
      )}
    </>
  );
}
