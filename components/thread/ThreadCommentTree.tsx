"use client";

import { CornerDownRight, MessagesSquare } from "lucide-react";
import { useState } from "react";
import { CheckBadgeIcon } from "@/components/shell/icons";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import type { ThreadCommentRow } from "@/lib/threads";
import CommentComposer from "./CommentComposer";
import { topicColor } from "./ThreadPostCard";
import VoteButtons from "./VoteButtons";

function childrenOf(all: ThreadCommentRow[], parentId: string | null) {
  return all.filter((c) => c.parentId === parentId);
}

function CommentNode({
  comment,
  all,
  canVote,
  siteKey,
  isLoggedIn,
}: {
  comment: ThreadCommentRow;
  all: ThreadCommentRow[];
  canVote: boolean;
  siteKey: string | null;
  isLoggedIn: boolean;
}) {
  const t = useT();
  const fmt = useFmt();
  const [replying, setReplying] = useState(false);
  const kids = childrenOf(all, comment.id);
  const named = comment.author.id ? comment.author.name : t("thread.anon");

  return (
    <div className="pt-3">
      <div className="flex items-center gap-2 text-xs text-yt-text2">
        {comment.author.image ? (
          <img
            src={comment.author.image}
            alt=""
            className="h-6 w-6 rounded-full bg-yt-hover object-cover"
          />
        ) : (
          <span
            className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: topicColor(named) }}
          >
            {named.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="font-semibold text-yt-text">{named}</span>
        {comment.author.verified && <CheckBadgeIcon width={13} height={13} />}
        <span aria-hidden>·</span>
        <span suppressHydrationWarning>{fmt.ago(comment.createdAt)}</span>
      </div>

      <div className="mt-1.5 pl-8">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-yt-text">
          {comment.removed ? (
            <span className="italic text-yt-text2">{t("thread.removed")}</span>
          ) : (
            comment.body
          )}
        </div>

        {!comment.removed && (
          <div className="mt-2 flex items-center gap-1.5">
            <VoteButtons
              targetType="comment"
              targetId={comment.id}
              score={comment.score}
              myVote={comment.myVote}
              canVote={canVote}
              size="sm"
            />
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-yt-text2 transition-colors hover:bg-yt-hover hover:text-yt-text"
            >
              <CornerDownRight size={14} />
              {t("comment.reply")}
            </button>
          </div>
        )}

        {replying && !comment.removed && (
          <div className="mt-2">
            <CommentComposer
              postId={comment.postId}
              parentId={comment.id}
              siteKey={siteKey}
              isLoggedIn={isLoggedIn}
              variant="reply"
              onDone={() => setReplying(false)}
            />
          </div>
        )}

        {kids.length > 0 && (
          <div className="mt-1 border-l-2 border-yt-outline pl-2 sm:pl-3">
            {kids.map((c) => (
              <CommentNode
                key={c.id}
                comment={c}
                all={all}
                canVote={canVote}
                siteKey={siteKey}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ThreadCommentTree({
  comments,
  canVote,
  siteKey,
  isLoggedIn,
}: {
  comments: ThreadCommentRow[];
  canVote: boolean;
  siteKey: string | null;
  isLoggedIn: boolean;
}) {
  const t = useT();
  const roots = childrenOf(comments, null);

  if (roots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-yt-outline py-12 text-center">
        <MessagesSquare size={28} className="text-yt-text2" />
        <p className="text-sm text-yt-text2">{t("thread.noComments")}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-yt-outline">
      {roots.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          all={comments}
          canVote={canVote}
          siteKey={siteKey}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </div>
  );
}
