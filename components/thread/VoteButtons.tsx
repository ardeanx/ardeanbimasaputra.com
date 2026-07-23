"use client";

import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useState, useTransition } from "react";
import { voteThreadAction } from "@/app/(shell)/threads/actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";

export default function VoteButtons({
  targetType,
  targetId,
  score: initialScore,
  myVote: initialVote,
  canVote,
  orientation,
  size = "md",
}: {
  targetType: "post" | "comment";
  targetId: string;
  score: number;
  myVote: number;
  canVote: boolean;
  orientation?: string;
  size?: "sm" | "md";
}) {
  const t = useT();
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState(initialVote);
  const [pending, start] = useTransition();
  const vertical = orientation === "vertical";
  const btn = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? 18 : 22;

  function cast(value: 1 | -1) {
    if (!canVote) {
      openAuthModal("signin");
      return;
    }
    if (pending) return;
    const prevScore = score;
    const prevVote = vote;
    const nextVote = vote === value ? 0 : value;
    setVote(nextVote);
    setScore(score + (nextVote - vote));
    start(async () => {
      const res = await voteThreadAction(targetType, targetId, value);
      if ("error" in res) {
        setScore(prevScore);
        setVote(prevVote);
      } else {
        setScore(res.score);
      }
    });
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full bg-yt-chip ${
        vertical ? "flex-col px-0.5 py-1" : "px-1"
      }`}
    >
      <button
        type="button"
        aria-label={t("thread.vote.up")}
        aria-pressed={vote === 1}
        onClick={() => cast(1)}
        className={`grid ${btn} place-items-center rounded-full transition-colors hover:bg-yt-hover ${
          vote === 1 ? "text-yt-cta" : "text-yt-text2 hover:text-yt-text"
        }`}
      >
        <ArrowBigUp size={icon} fill={vote === 1 ? "currentColor" : "none"} />
      </button>
      <span
        className={`min-w-6 text-center text-sm font-semibold tabular-nums ${
          vote === 1 ? "text-yt-cta" : vote === -1 ? "text-yt-text" : "text-yt-text"
        }`}
      >
        {score}
      </span>
      <button
        type="button"
        aria-label={t("thread.vote.down")}
        aria-pressed={vote === -1}
        onClick={() => cast(-1)}
        className={`grid ${btn} place-items-center rounded-full transition-colors hover:bg-yt-hover ${
          vote === -1 ? "text-yt-text" : "text-yt-text2 hover:text-yt-text"
        }`}
      >
        <ArrowBigDown size={icon} fill={vote === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
