"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createQnaCommentAction } from "@/app/(shell)/qna/actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { toast } from "sonner";

export default function QnaCommentComposer({
  targetType,
  targetId,
  isLoggedIn,
  onDone,
}: {
  targetType: "question" | "answer";
  targetId: string;
  isLoggedIn: boolean;
  onDone?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!isLoggedIn) {
      openAuthModal("signin");
      return;
    }
    if (!body.trim() || pending) return;
    start(async () => {
      const res = await createQnaCommentAction({
        targetType,
        targetId,
        body: body.trim(),
      });
      if ("error" in res) toast.error(t(res.error));
      else {
        setBody("");
        onDone?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-start gap-2">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder={t("qna.comment.placeholder")}
        className="min-w-0 flex-1 border-b border-yt-outline bg-transparent pb-1 text-sm outline-none focus:border-yt-text placeholder:text-yt-text2"
      />
      <button
        onClick={submit}
        disabled={pending || !body.trim()}
        className="h-8 rounded-full bg-yt-chip px-3 text-sm font-medium hover:bg-yt-chip-hover disabled:opacity-50"
      >
        {t("qna.comment.submit")}
      </button>
      {onDone && (
        <button
          onClick={onDone}
          className="h-8 rounded-full px-3 text-sm font-medium hover:bg-yt-hover"
        >
          {t("common.cancel")}
        </button>
      )}
    </div>
  );
}
