"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCommentAction } from "@/app/(studio)/studio/comments/actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { askConfirm } from "@/components/ui/dialog";

export type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorImage: string | null;
  postId: string;
  postTitle: string;
};

export default function CommentsTable({ rows }: { rows: CommentRow[] }) {
  const t = useT();
  const fmt = useFmt();
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (r) => r.body.toLowerCase().includes(q) || r.authorName.toLowerCase().includes(q),
    );
  }, [items, query]);

  async function remove(row: CommentRow) {
    const ok = await askConfirm({
      title: t("studio.comments.deleteTitle"),
      body: t("studio.comments.deleteBody", { name: row.authorName }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await deleteCommentAction(row.id);
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(t("studio.comments.deleted"));
        setItems((prev) => prev.filter((r) => r.id !== row.id));
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("studio.comments.searchPlaceholder")}
          className="ml-auto h-9 w-64 rounded-full border border-yt-outline bg-transparent px-4 text-sm outline-none focus:border-yt-cta"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-yt-text2">{t("studio.comments.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-yt-outline">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-3 border-b border-yt-outline/60 px-4 py-3 last:border-b-0 hover:bg-yt-hover/60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-yt-chip text-sm font-medium">
                {r.authorImage ? (
                  <img src={r.authorImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  r.authorName.charAt(0).toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-yt-text2">
                  <span className="font-medium text-yt-text">{r.authorName}</span>
                  <span suppressHydrationWarning>{fmt.ago(r.createdAt)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm">{r.body}</p>
                <Link
                  href={`/watch?v=${r.postId}`}
                  className="mt-1 inline-block max-w-full truncate text-xs text-yt-cta hover:underline"
                >
                  {r.postTitle}
                </Link>
              </div>
              <button
                type="button"
                aria-label={t("studio.comments.deleteAria")}
                disabled={pending}
                onClick={() => remove(r)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-red-500 hover:bg-yt-hover disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
