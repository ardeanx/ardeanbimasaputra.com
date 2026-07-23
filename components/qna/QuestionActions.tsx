"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useT } from "@/components/i18n/I18nProvider";
import { BookmarkIcon, ShareIcon } from "@/components/shell/icons";

const KEY = "qna:saved";
const listeners = new Set<() => void>();

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function writeSaved(id: string, on: boolean) {
  const list = readSaved();
  const next = on ? [...new Set([...list, id])] : list.filter((x) => x !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  listeners.forEach((l) => l());
}

export function SaveButton({ questionId }: { questionId: string }) {
  const t = useT();
  const saved = useSyncExternalStore(
    subscribe,
    () => readSaved().includes(questionId),
    () => false,
  );

  function toggle() {
    writeSaved(questionId, !saved);
    toast.success(t(saved ? "qna.unsaved" : "qna.saved"));
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={saved}
      aria-label={t("qna.save")}
      title={t("qna.save")}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
        saved
          ? "border-yt-cta/40 bg-yt-cta/15 text-yt-cta"
          : "border-yt-outline text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
      }`}
    >
      <BookmarkIcon width={20} height={20} />
    </button>
  );
}

export function ShareButton() {
  const t = useT();

  function share() {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success(t("toast.linkCopied")),
      () => undefined,
    );
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-full border border-yt-outline px-3.5 py-1.5 text-sm font-medium text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
    >
      <ShareIcon width={17} height={17} />
      {t("qna.share")}
    </button>
  );
}
