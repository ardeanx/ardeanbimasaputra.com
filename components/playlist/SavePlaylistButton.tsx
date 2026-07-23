"use client";

import { useState, useTransition } from "react";
import {
  createPlaylistAction,
  playlistsForPostAction,
  togglePlaylistItemAction,
} from "@/app/(shell)/playlist-actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { BookmarkIcon, PlusIcon } from "@/components/shell/icons";

type Row = { id: string; title: string; has: boolean };

export default function SavePlaylistButton({
  postId,
  viewerId,
}: {
  postId: string;
  viewerId: string | null;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [, start] = useTransition();

  if (!viewerId) {
    return (
      <button
        onClick={() => openAuthModal("signin")}
        aria-label={t("card.save")}
        className="grid h-10 w-10 place-items-center rounded-full bg-yt-chip hover:bg-yt-chip-hover"
      >
        <BookmarkIcon width={24} height={24} />
      </button>
    );
  }

  function refresh() {
    start(async () => setRows((await playlistsForPostAction(postId)) as Row[]));
  }

  function toggleOpen() {
    setOpen((o) => {
      if (!o) refresh();
      return !o;
    });
  }

  function toggleItem(id: string) {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, has: !r.has } : r)));
    start(() => togglePlaylistItemAction(id, postId).then(() => {}));
  }

  function create() {
    const t = newTitle.trim();
    if (!t) return;
    setNewTitle("");
    start(async () => {
      await createPlaylistAction(t, postId);
      setRows((await playlistsForPostAction(postId)) as Row[]);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        aria-label={t("card.save")}
        className="grid h-10 w-10 place-items-center rounded-full bg-yt-chip hover:bg-yt-chip-hover"
      >
        <BookmarkIcon width={24} height={24} />
      </button>
      {open && (
        <>
          <button
            aria-label="Tutup"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50 w-64 rounded-xl bg-yt-menu p-3 shadow-[0_4px_32px_rgba(0,0,0,0.25)]">
            <p className="mb-2 text-sm font-medium">Simpan ke…</p>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {rows.length === 0 && <p className="text-xs text-yt-text2">Belum ada playlist.</p>}
              {rows.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-yt-hover"
                >
                  <input type="checkbox" checked={r.has} onChange={() => toggleItem(r.id)} />
                  <span className="line-clamp-1">{r.title}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-1 border-t border-yt-outline pt-3">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Playlist baru"
                className="min-w-0 flex-1 rounded border border-yt-outline bg-transparent px-2 py-1 text-sm outline-none focus:border-yt-cta"
              />
              <button
                onClick={create}
                aria-label="Buat playlist"
                className="grid h-8 w-8 shrink-0 place-items-center rounded bg-yt-chip hover:bg-yt-chip-hover"
              >
                <PlusIcon width={18} height={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
