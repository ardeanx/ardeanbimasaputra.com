"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useFmt, useT } from "@/components/i18n/I18nProvider";
import { CheckBadgeIcon } from "@/components/shell/icons";
import QnaCommentComposer from "./QnaCommentComposer";
import type { QnaCommentRow } from "@/lib/qna";

export default function QnaComments({
  targetType,
  targetId,
  comments,
  isLoggedIn,
}: {
  targetType: "question" | "answer";
  targetId: string;
  comments: QnaCommentRow[];
  isLoggedIn: boolean;
}) {
  const t = useT();
  const fmt = useFmt();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-yt-outline/60 pt-1">
      {comments.length > 0 && (
        <ul>
          {comments.map((c) => (
            <li
              key={c.id}
              className="border-b border-yt-outline/40 py-2 text-sm leading-6 last:border-b-0"
            >
              <span className="text-yt-text">{c.body}</span>
              <span className="ml-1.5 inline-flex items-center gap-1 align-middle text-xs text-yt-text2">
                <span className="text-yt-text2/60">—</span>
                <span className="font-medium">{c.author.name}</span>
                {c.author.verified && <CheckBadgeIcon width={11} height={11} />}
                <span className="text-yt-text2/70">· {fmt.ago(c.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <div className="pt-2">
          <QnaCommentComposer
            targetType={targetType}
            targetId={targetId}
            isLoggedIn={isLoggedIn}
            onDone={() => setOpen(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-yt-text2 hover:text-yt-text"
        >
          <MessageSquarePlus size={14} />
          {t("qna.comment.add")}
        </button>
      )}
    </div>
  );
}
