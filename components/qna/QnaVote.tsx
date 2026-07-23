"use client";

import { useState, useTransition } from "react";
import { voteQnaAction } from "@/app/(shell)/qna/actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { toast } from "sonner";

function Caret({ up }: { up: boolean }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      <path d={up ? "M12 6l7 9H5z" : "M12 18l-7-9h14z"} fill="currentColor" />
    </svg>
  );
}

export default function QnaVote({
  targetType,
  targetId,
  score,
  myVote,
  canVote,
  orientation = "vertical",
}: {
  targetType: "question" | "answer";
  targetId: string;
  score: number;
  myVote: number;
  canVote: boolean;
  orientation?: string;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const [state, setState] = useState({ score, myVote });

  function vote(value: 1 | -1) {
    if (!canVote) {
      openAuthModal("signin");
      return;
    }
    if (pending) return;
    const prev = state;
    const nextVote = state.myVote === value ? 0 : value;
    setState({ score: state.score - state.myVote + nextVote, myVote: nextVote });
    start(async () => {
      const res = await voteQnaAction(targetType, targetId, value);
      if ("error" in res) {
        setState(prev);
        toast.error(t(res.error));
      } else {
        setState((s) => ({ ...s, score: res.score }));
      }
    });
  }

  return (
    <div className={`flex items-center gap-1.5 ${orientation === "vertical" ? "flex-col" : ""}`}>
      <button
        onClick={() => vote(1)}
        aria-pressed={state.myVote === 1}
        aria-label={t("qna.vote.up")}
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
          state.myVote === 1
            ? "border-yt-cta/40 bg-yt-cta/15 text-yt-cta"
            : "border-yt-outline text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
        }`}
      >
        <Caret up />
      </button>
      <span className="min-w-8 text-center text-lg font-semibold tabular-nums text-yt-text">
        {state.score}
      </span>
      <button
        onClick={() => vote(-1)}
        aria-pressed={state.myVote === -1}
        aria-label={t("qna.vote.down")}
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
          state.myVote === -1
            ? "border-yt-cta/40 bg-yt-cta/15 text-yt-cta"
            : "border-yt-outline text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
        }`}
      >
        <Caret up={false} />
      </button>
    </div>
  );
}
