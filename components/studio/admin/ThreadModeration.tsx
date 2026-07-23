"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTopicAction, moderateThreadAction } from "@/app/(studio)/studio/threads/actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { askConfirm } from "@/components/ui/dialog";
import { toast } from "sonner";

type Post = {
  id: string;
  title: string;
  authorName: string;
  topicName: string | null;
  score: number;
  commentCount: number;
  removed: boolean;
  createdAt: string;
};

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ThreadModeration({ posts }: { posts: Post[] }) {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");

  function moderate(id: string, removed: boolean) {
    const run = () =>
      start(async () => {
        const res = await moderateThreadAction("post", id, removed);
        if ("error" in res) toast.error(t(res.error));
        else {
          toast.success(t(removed ? "studio.threads.removed" : "studio.threads.restored"));
          router.refresh();
        }
      });
    if (removed) {
      askConfirm({
        title: t("studio.threads.removeTitle"),
        body: t("studio.threads.removeBody"),
        confirmLabel: t("studio.threads.remove"),
        danger: true,
      }).then((ok) => {
        if (ok) run();
      });
    } else run();
  }

  function submitTopic(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(name);
    if (!name.trim() || !slug) {
      toast.error(t("studio.threads.topicInput"));
      return;
    }
    start(async () => {
      const res = await createTopicAction({ name: name.trim(), slug, description, color });
      if ("error" in res) toast.error(t(res.error));
      else {
        toast.success(t("studio.threads.topicCreated"));
        setName("");
        setDescription("");
        setColor("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submitTopic} className="rounded-xl border border-yt-outline p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("studio.threads.newTopic")}</h2>
        <div className="flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("studio.threads.topicName")}
            className="h-9 flex-1 rounded-lg border border-yt-outline bg-yt-base px-3 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("studio.threads.topicDesc")}
            className="h-9 flex-1 rounded-lg border border-yt-outline bg-yt-base px-3 text-sm"
          />
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#ff0000"
            className="h-9 w-28 rounded-lg border border-yt-outline bg-yt-base px-3 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-full bg-yt-cta px-4 text-sm font-medium text-yt-cta-text disabled:opacity-50"
          >
            {t("studio.threads.create")}
          </button>
        </div>
        {name.trim() && <p className="mt-2 text-xs text-yt-text2">/{slugify(name)}</p>}
      </form>

      <div>
        <h2 className="mb-3 text-sm font-semibold">{t("studio.threads.recent")}</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-yt-text2">{t("studio.threads.empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-yt-outline">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-yt-outline text-left text-xs text-yt-text2">
                  <th className="p-3 font-medium">{t("studio.threads.colTitle")}</th>
                  <th className="p-3 font-medium">{t("studio.threads.colAuthor")}</th>
                  <th className="p-3 font-medium">{t("studio.threads.colTopic")}</th>
                  <th className="p-3 font-medium">{t("studio.threads.colScore")}</th>
                  <th className="p-3 font-medium">{t("studio.threads.colComments")}</th>
                  <th className="p-3 font-medium">{t("studio.threads.colCreated")}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-yt-outline last:border-0 ${
                      p.removed ? "opacity-50" : ""
                    }`}
                  >
                    <td className="max-w-xs p-3">
                      <span className="line-clamp-1">{p.title}</span>
                    </td>
                    <td className="p-3 text-yt-text2">{p.authorName}</td>
                    <td className="p-3 text-yt-text2">{p.topicName ?? "—"}</td>
                    <td className="p-3 tabular-nums">{p.score}</td>
                    <td className="p-3 tabular-nums">{p.commentCount}</td>
                    <td className="whitespace-nowrap p-3 text-yt-text2">{fmt.ago(p.createdAt)}</td>
                    <td className="p-3 text-right">
                      {p.removed ? (
                        <button
                          onClick={() => moderate(p.id, false)}
                          disabled={pending}
                          className="h-8 rounded-full bg-yt-chip px-3 text-xs font-medium hover:bg-yt-chip-hover disabled:opacity-50"
                        >
                          {t("studio.threads.restore")}
                        </button>
                      ) : (
                        <button
                          onClick={() => moderate(p.id, true)}
                          disabled={pending}
                          className="h-8 rounded-full bg-yt-chip px-3 text-xs font-medium text-red-500 hover:bg-yt-chip-hover disabled:opacity-50"
                        >
                          {t("studio.threads.remove")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
