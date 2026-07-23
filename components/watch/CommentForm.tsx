"use client";

import { useRef, useState, useTransition } from "react";
import { addCommentAction } from "@/app/(shell)/actions";
import { useT } from "@/components/i18n/I18nProvider";

export default function CommentForm({
  postId,
  parentId,
  avatar,
  autoFocus,
  onDone,
}: {
  postId: string;
  parentId?: string;
  avatar: string | null;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const t = useT();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    if (!value.trim()) return;
    start(async () => {
      const res = await addCommentAction(postId, value, parentId);
      if ("error" in res) setError(res.error);
      else {
        setValue("");
        setError(null);
        onDone?.();
      }
    });
  }

  return (
    <div className="flex gap-3">
      <img src={avatar ?? ""} alt="" className="h-9 w-9 shrink-0 rounded-full bg-yt-hover" />
      <div className="min-w-0 flex-1">
        <textarea
          ref={ref}
          autoFocus={autoFocus}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={parentId ? t("comment.replyPlaceholder") : t("comment.addPlaceholder")}
          className="w-full resize-none border-b border-yt-outline bg-transparent pb-1 text-sm outline-none focus:border-yt-text placeholder:text-yt-text2"
        />
        {error && <p className="mt-1 text-xs text-yt-cta">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          {onDone && (
            <button
              onClick={onDone}
              className="h-9 rounded-full px-4 text-sm font-medium hover:bg-yt-hover"
            >
              {t("common.cancel")}
            </button>
          )}
          <button
            onClick={submit}
            disabled={pending || !value.trim()}
            className="h-9 rounded-full bg-yt-cta px-4 text-sm font-medium text-yt-cta-text disabled:bg-yt-chip disabled:text-yt-text2"
          >
            {t("comment.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
