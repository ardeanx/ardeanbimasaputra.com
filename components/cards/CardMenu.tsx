"use client";

import { Bookmark, ExternalLink, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  createPlaylistAction,
  playlistsForPostAction,
  togglePlaylistItemAction,
} from "@/app/(shell)/playlist-actions";
import { useT } from "@/components/i18n/I18nProvider";
import { MoreVertIcon, PlusIcon } from "@/components/shell/icons";
import EmptyState from "@/components/ui/EmptyState";

type Row = { id: string; title: string; has: boolean };

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  ta.remove();
  return ok;
}

export default function CardMenu({ url, postId }: { url: string; postId: string }) {
  const t = useT();
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [view, setView] = useState<"main" | "save">("main");
  const [rows, setRows] = useState<Row[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [, start] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    function close() {
      setPos(null);
    }
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    }
    function onScroll(e: Event) {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    }
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggleMenu() {
    if (pos) {
      setPos(null);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setView("main");
    setPos({
      left: Math.max(8, Math.min(r.right - 224, window.innerWidth - 232)),
      top: r.bottom + 4,
    });
  }

  const fullUrl = () => `${window.location.origin}${url}`;

  async function copyLink() {
    setPos(null);
    if (await copyText(fullUrl())) toast.success(t("toast.linkCopied"));
    else toast.error(t("toast.linkCopyFailed"));
  }

  async function share() {
    setPos(null);
    if (navigator.share) {
      try {
        await navigator.share({ url: fullUrl() });
      } catch {}
      return;
    }
    if (await copyText(fullUrl())) toast.success(t("toast.linkCopied"));
    else toast.error(t("toast.linkCopyFailed"));
  }

  function openSave() {
    setView("save");
    start(async () => setRows((await playlistsForPostAction(postId)) as Row[]));
  }

  function toggleItem(id: string) {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, has: !r.has } : r)));
    start(async () => {
      const res = await togglePlaylistItemAction(id, postId);
      if (res && "error" in res && res.error) toast.error(res.error);
    });
  }

  function create() {
    const t = newTitle.trim();
    if (!t) return;
    setNewTitle("");
    start(async () => {
      const res = await createPlaylistAction(t, postId);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setRows((await playlistsForPostAction(postId)) as Row[]);
    });
  }

  const item = "flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-yt-hover";

  return (
    <>
      <button
        ref={btnRef}
        aria-label={t("aria.moreActions")}
        onClick={toggleMenu}
        className={`grid h-9 w-9 place-items-center rounded-full hover:bg-yt-hover focus:opacity-100 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        <MoreVertIcon width={20} height={20} />
      </button>
      {pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ left: pos.left, top: pos.top }}
            className="fixed z-[95] w-56 rounded-xl bg-yt-menu py-1.5 shadow-[0_4px_32px_rgba(0,0,0,0.3)]"
          >
            {view === "main" ? (
              <>
                <button onClick={copyLink} className={item}>
                  <Link2 size={18} className="shrink-0 text-yt-text2" />
                  {t("card.copyLink")}
                </button>
                <button onClick={share} className={item}>
                  <Share2 size={18} className="shrink-0 text-yt-text2" />
                  {t("card.share")}
                </button>
                <button onClick={openSave} className={item}>
                  <Bookmark size={18} className="shrink-0 text-yt-text2" />
                  {t("card.save")}
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPos(null)}
                  className={item}
                >
                  <ExternalLink size={18} className="shrink-0 text-yt-text2" />
                  {t("card.openNewTab")}
                </a>
              </>
            ) : (
              <div className="px-3 pb-2">
                <p className="px-1 py-2 text-sm font-medium">{t("card.saveTo")}</p>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {rows.length === 0 && <EmptyState title={t("playlist.empty")} className="py-4" />}
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
                <div className="mt-2 flex gap-1 border-t border-yt-outline pt-2">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && create()}
                    placeholder={t("playlist.newPlaceholder")}
                    className="min-w-0 flex-1 rounded border border-yt-outline bg-transparent px-2 py-1 text-sm outline-none focus:border-yt-cta"
                  />
                  <button
                    onClick={create}
                    aria-label={t("aria.createPlaylist")}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded bg-yt-chip hover:bg-yt-chip-hover"
                  >
                    <PlusIcon width={18} height={18} />
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
