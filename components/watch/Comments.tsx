import { listComments } from "@/lib/community";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

export default async function Comments({ postId }: { postId: string }) {
  const t = await getT();
  const session = await getSession();
  const viewerId = session?.user.id ?? null;
  const comments = await listComments(postId, viewerId ?? undefined);
  const total = comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  const isAdmin = (session?.user as { role?: string | null } | undefined)?.role === "admin";
  const avatar = session?.user.image ?? null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{t("comment.count", { n: total })}</h2>
      {viewerId ? (
        <div className="mt-4">
          <CommentForm postId={postId} avatar={avatar} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-yt-text2">{t("comment.signInPrompt")}</p>
      )}

      <div className="mt-6 flex flex-col gap-5">
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            data={c}
            replies={c.replies}
            postId={postId}
            viewerId={viewerId}
            viewerAvatar={avatar}
            isAdmin={Boolean(isAdmin)}
          />
        ))}
      </div>
    </section>
  );
}
