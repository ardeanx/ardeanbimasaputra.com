"use client";

import { useState, useTransition } from "react";
import { toggleReactionAction } from "@/app/(shell)/actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { ThumbDownIcon, ThumbUpIcon } from "@/components/shell/icons";

export default function LikeButton({
  postId,
  initialLikeCount,
  initialReaction,
  disabled,
}: {
  postId: string;
  initialLikeCount: number;
  initialReaction: 1 | -1 | null;
  disabled?: boolean;
}) {
  const t = useT();
  const fmt = useFmt();
  const [count, setCount] = useState(initialLikeCount);
  const [reaction, setReaction] = useState<1 | -1 | null>(initialReaction);
  const [pending, start] = useTransition();

  function react(value: 1 | -1) {
    if (disabled || pending) return;
    start(async () => {
      const res = await toggleReactionAction(postId, value);
      if ("likeCount" in res) {
        setCount(res.likeCount);
        setReaction(res.reaction);
      }
    });
  }

  return (
    <div className="flex h-10 items-center rounded-full bg-yt-chip">
      <button
        onClick={() => react(1)}
        disabled={pending || disabled}
        aria-pressed={reaction === 1}
        aria-label={t("aria.like")}
        className={`flex h-full items-center gap-1.5 rounded-l-full pl-3.5 pr-3 text-sm font-medium hover:bg-yt-chip-hover ${
          reaction === 1 ? "text-yt-cta" : ""
        }`}
      >
        <ThumbUpIcon width={24} height={24} />
        {fmt.compact(count)}
      </button>
      <span className="h-6 w-px bg-yt-outline" />
      <button
        onClick={() => react(-1)}
        disabled={pending || disabled}
        aria-pressed={reaction === -1}
        aria-label={t("aria.dislike")}
        className={`flex h-full items-center rounded-r-full px-3 hover:bg-yt-chip-hover ${
          reaction === -1 ? "text-yt-cta" : ""
        }`}
      >
        <ThumbDownIcon width={24} height={24} />
      </button>
    </div>
  );
}
