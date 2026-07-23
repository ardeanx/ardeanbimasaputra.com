"use client";

import { useState, useTransition } from "react";
import { voteThreadPollAction } from "@/app/(shell)/threads/poll-actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";

type Poll = { options: string[]; endsAt: string | null };

export default function PollDisplay({
  postId,
  poll,
  counts: initialCounts,
  myVote: initialMyVote,
  canVote,
}: {
  postId: string;
  poll: Poll;
  counts: number[];
  myVote: number | null;
  canVote: boolean;
}) {
  const t = useT();
  const [counts, setCounts] = useState<number[]>(initialCounts);
  const [myVote, setMyVote] = useState<number | null>(initialMyVote);
  const [pending, start] = useTransition();

  const closed = !!poll.endsAt && new Date(poll.endsAt).getTime() < new Date().getTime();
  const showResults = myVote !== null || closed;
  const total = counts.reduce((a, b) => a + b, 0);

  function vote(i: number) {
    if (pending || showResults) return;
    if (!canVote) {
      openAuthModal("signin");
      return;
    }
    start(async () => {
      const res = await voteThreadPollAction(postId, i);
      if ("ok" in res) {
        setCounts(res.counts);
        setMyVote(res.myVote);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {poll.options.map((opt, i) => {
        const n = counts[i] ?? 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        const mine = myVote === i;
        if (showResults) {
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-yt-outline bg-yt-raised px-3 py-2"
            >
              <div
                className={`absolute inset-y-0 left-0 ${mine ? "bg-yt-cta/25" : "bg-yt-hover"}`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-yt-text">
                  {mine ? "✓ " : ""}
                  {opt}
                </span>
                <span className="shrink-0 text-yt-text2">{pct}%</span>
              </div>
            </div>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => vote(i)}
            disabled={pending}
            className="rounded-xl border border-yt-outline bg-yt-raised px-3 py-2 text-left text-sm text-yt-text hover:bg-yt-hover disabled:opacity-60"
          >
            {opt}
          </button>
        );
      })}
      <p className="text-xs text-yt-text2">
        {t("thread.poll.votes", { n: total })}
        {closed ? ` · ${t("thread.poll.closed")}` : ""}
      </p>
    </div>
  );
}
