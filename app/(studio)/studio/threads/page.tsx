import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import ThreadModeration from "@/components/studio/admin/ThreadModeration";
import { threadPost, threadTopic, user } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioThreads() {
  const session = await getSession();
  const isAdmin = (session?.user as { role?: string | null } | undefined)?.role === "admin";
  if (!isAdmin) redirect("/studio");

  const t = await getT();

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

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{t("studio.threads.title")}</h1>
      <p className="mb-6 text-sm text-yt-text2">{t("studio.threads.sub")}</p>
      <ThreadModeration posts={posts} />
    </div>
  );
}
