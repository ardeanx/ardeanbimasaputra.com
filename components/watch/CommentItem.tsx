"use client";

import { useState, useTransition } from "react";
import { deleteCommentAction, toggleCommentLikeAction } from "@/app/(shell)/actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { CheckBadgeIcon, ThumbUpIcon } from "@/components/shell/icons";
import type { CommentReply } from "@/lib/community";
import CommentForm from "./CommentForm";

type Props = {
  data: CommentReply;
  postId: string;
  viewerId: string | null;
  viewerAvatar: string | null;
  isAdmin: boolean;
  isReply?: boolean;
  replies?: CommentReply[];
};

export default function CommentItem({
  data,
  postId,
  viewerId,
  viewerAvatar,
  isAdmin,
  isReply,
  replies,
}: Props) {
  const t = useT();
  const fmt = useFmt();
  const [liked, setLiked] = useState(data.likedByMe);
  const [count, setCount] = useState(data.likeCount);
  const [replying, setReplying] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [, start] = useTransition();

  if (removed) return null;
  const canDelete = isAdmin || viewerId === data.author.id;

  return (
    <div className="flex gap-3">
      <img
        src={data.author.image ?? ""}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full bg-yt-hover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[13px]">
          <span className="font-medium">{data.author.name}</span>
          {(data.author.role === "admin" || data.author.verified) && (
            <CheckBadgeIcon width={12} height={12} />
          )}
          <span suppressHydrationWarning className="text-yt-text2">
            {fmt.ago(data.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm">{data.body}</p>

        <div className="mt-1 flex items-center gap-3 text-xs text-yt-text2">
          <button
            aria-pressed={liked}
            onClick={() =>
              viewerId &&
              start(async () => {
                const res = await toggleCommentLikeAction(data.id);
                if ("count" in res) {
                  setLiked(res.liked);
                  setCount(res.count);
                }
              })
            }
            className={`flex items-center gap-1 hover:text-yt-text ${liked ? "text-yt-cta" : ""}`}
          >
            <ThumbUpIcon width={16} height={16} />
            {count > 0 && fmt.compact(count)}
          </button>
          {!isReply && viewerId && (
            <button onClick={() => setReplying(true)} className="font-medium hover:text-yt-text">
              {t("comment.reply")}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() =>
                start(async () => {
                  await deleteCommentAction(data.id);
                  setRemoved(true);
                })
              }
              className="hover:text-yt-text"
            >
              {t("common.delete")}
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={data.id}
              avatar={viewerAvatar}
              autoFocus
              onDone={() => setReplying(false)}
            />
          </div>
        )}

        {replies && replies.length > 0 && (
          <div className="mt-4 flex flex-col gap-4">
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                data={r}
                postId={postId}
                viewerId={viewerId}
                viewerAvatar={viewerAvatar}
                isAdmin={isAdmin}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
