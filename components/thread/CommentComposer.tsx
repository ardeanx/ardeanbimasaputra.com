"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Turnstile, turnstileToken } from "@/app/(auth)/Turnstile";
import { createThreadCommentAction } from "@/app/(shell)/threads/actions";
import { useT } from "@/components/i18n/I18nProvider";

export default function CommentComposer({
  postId,
  parentId,
  isLoggedIn,
  siteKey,
  onDone,
}: {
  postId: string;
  parentId?: string | null;
  isLoggedIn: boolean;
  siteKey: string | null;
  variant?: string;
  onDone?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [anonName, setAnonName] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!body.trim() || pending) return;
    start(async () => {
      const res = await createThreadCommentAction({
        postId,
        parentId: parentId ?? null,
        body,
        anonName: isLoggedIn ? undefined : anonName,
        turnstileToken: !isLoggedIn && siteKey ? turnstileToken() : undefined,
      });
      if ("error" in res) {
        toast.error(t(res.error));
        return;
      }
      setBody("");
      setAnonName("");
      onDone?.();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-yt-outline bg-yt-base p-2.5 transition-colors focus-within:border-yt-searchborder">
      <textarea
        rows={parentId ? 2 : 3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("thread.comment.placeholder")}
        className="w-full resize-none bg-transparent px-1 text-sm outline-none placeholder:text-yt-text2"
      />
      {!isLoggedIn && (
        <input
          value={anonName}
          onChange={(e) => setAnonName(e.target.value)}
          placeholder={t("thread.anonNamePlaceholder")}
          aria-label={t("thread.anonName")}
          className="w-full rounded-lg border border-yt-outline bg-yt-raised px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-yt-searchborder placeholder:text-yt-text2"
        />
      )}
      {!isLoggedIn && siteKey && <Turnstile siteKey={siteKey} />}
      <div className="flex justify-end gap-2">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="h-9 rounded-full px-4 text-sm font-medium text-yt-text2 transition-colors hover:bg-yt-hover hover:text-yt-text"
          >
            {t("common.cancel")}
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={pending || !body.trim()}
          className="h-9 rounded-full bg-yt-cta px-4 text-sm font-semibold text-yt-cta-text transition-opacity hover:opacity-90 disabled:bg-yt-chip disabled:text-yt-text2 disabled:opacity-100"
        >
          {pending ? t("thread.comment.submitting") : t("thread.comment.submit")}
        </button>
      </div>
    </div>
  );
}
