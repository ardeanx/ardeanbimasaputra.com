import { desc } from "drizzle-orm";
import CommentsTable, { type CommentRow } from "@/components/studio/admin/CommentsTable";
import { comment } from "@/db/schema";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioComments() {
  await requireAdmin();
  const t = await getT();

  const rows = await db.query.comment.findMany({
    with: {
      author: true,
      post: { columns: { id: true, title: true } },
    },
    orderBy: [desc(comment.createdAt)],
    limit: 100,
  });

  const data: CommentRow[] = rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    authorName: r.author.name,
    authorImage: r.author.image,
    postId: r.post.id,
    postTitle: r.post.title,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("studio.comments.title")}</h1>
        <p className="mt-0.5 text-sm text-yt-text2">{t("studio.comments.subtitle")}</p>
      </div>
      <CommentsTable rows={data} />
    </div>
  );
}
