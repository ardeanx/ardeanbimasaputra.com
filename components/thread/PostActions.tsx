"use client";

import { Bookmark, MessageSquare, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/i18n/I18nProvider";

const pill =
  "inline-flex items-center gap-1.5 rounded-full bg-yt-chip px-3 py-1.5 text-xs font-semibold text-yt-text2 transition-colors hover:bg-yt-chip-hover hover:text-yt-text";

export default function PostActions({
  postId,
  commentCount,
  className = "",
}: {
  postId: string;
  commentCount: number;
  className?: string;
}) {
  const t = useT();
  const [saved, setSaved] = useState(false);

  function share() {
    navigator.clipboard
      ?.writeText(`${window.location.origin}/threads/p/${postId}`)
      .then(() => toast.success(t("toast.linkCopied")))
      .catch(() => undefined);
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Link href={`/threads/p/${postId}`} className={pill}>
        <MessageSquare size={15} />
        {t("thread.commentsCount", { n: commentCount })}
      </Link>
      <button type="button" onClick={share} className={pill}>
        <Share2 size={15} />
        {t("card.share")}
      </button>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => {
          setSaved((s) => !s);
          toast.success(saved ? t("card.save") : t("nav.saved"));
        }}
        className={
          saved
            ? "inline-flex items-center gap-1.5 rounded-full bg-yt-chip-hover px-3 py-1.5 text-xs font-semibold text-yt-text transition-colors"
            : pill
        }
      >
        <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
        {saved ? t("nav.saved") : t("card.save")}
      </button>
    </div>
  );
}
