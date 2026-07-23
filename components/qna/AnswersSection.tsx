"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import AcceptButton from "./AcceptButton";
import AuthorByline from "./AuthorByline";
import QnaBody from "./QnaBody";
import QnaComments from "./QnaComments";
import QnaVote from "./QnaVote";
import type { AnswerRow, QnaCommentRow } from "@/lib/qna";

type Sort = "votes" | "newest";

export default function AnswersSection({
  questionId,
  answers,
  commentsByAnswer,
  canVote,
  canAccept,
  isLoggedIn,
}: {
  questionId: string;
  answers: AnswerRow[];
  commentsByAnswer: Record<string, QnaCommentRow[]>;
  canVote: boolean;
  canAccept: boolean;
  isLoggedIn: boolean;
}) {
  const t = useT();
  const fmt = useFmt();
  const [sort, setSort] = useState<Sort>("votes");

  const sorted = useMemo(() => {
    const arr = [...answers];
    arr.sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? -1 : 1;
      if (sort === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.score - a.score;
    });
    return arr;
  }, [answers, sort]);

  const sorts: Sort[] = ["votes", "newest"];

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-yt-outline pb-3">
        <h2 className="text-lg font-semibold text-yt-text">
          {answers.length} {t("qna.answers")}
        </h2>
        {answers.length > 1 && (
          <div className="flex items-center gap-1 rounded-full bg-yt-chip p-1">
            {sorts.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={sort === s}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  sort === s
                    ? "bg-yt-menu text-yt-text shadow-sm"
                    : "text-yt-text2 hover:text-yt-text"
                }`}
              >
                {t(`qna.sort.${s}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {answers.length === 0 ? (
        <p className="mt-6 text-sm text-yt-text2">{t("qna.noAnswers")}</p>
      ) : (
        <div className="divide-y divide-yt-outline">
          {sorted.map((a) => (
            <article
              key={a.id}
              className={`flex gap-4 py-6 ${
                a.accepted
                  ? "-mx-4 rounded-r-lg border-l-4 border-green-500 bg-green-500/5 px-4"
                  : ""
              }`}
            >
              <div className="flex shrink-0 flex-col items-center gap-2">
                <QnaVote
                  targetType="answer"
                  targetId={a.id}
                  score={a.score}
                  myVote={a.myVote}
                  canVote={canVote}
                />
                <AcceptButton
                  questionId={questionId}
                  answerId={a.id}
                  accepted={a.accepted}
                  canAccept={canAccept}
                />
              </div>
              <div className="min-w-0 flex-1">
                {a.accepted && (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-500">
                    <Check size={14} strokeWidth={3} />
                    {t("qna.accepted")}
                  </div>
                )}
                <QnaBody body={a.body} ogCard={a.ogCard} />
                <div className="mt-4 flex justify-end">
                  <div className="rounded-lg bg-yt-raised px-3 py-2">
                    <AuthorByline
                      author={a.author}
                      ago={fmt.ago(a.createdAt)}
                      action={t("qna.answered")}
                      avatarSize={24}
                    />
                  </div>
                </div>
                <QnaComments
                  targetType="answer"
                  targetId={a.id}
                  comments={commentsByAnswer[a.id] ?? []}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
