"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createQuestionAction } from "@/app/(shell)/qna/actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { hasRteContent } from "@/components/qna/QnaBody";
import RichEditor from "@/components/rte/RichEditor";
import { toast } from "sonner";

export default function QuestionComposer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useT();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!isLoggedIn) {
      openAuthModal("signin");
      return;
    }
    if (!title.trim() || !hasRteContent(body) || pending) return;
    start(async () => {
      const res = await createQuestionAction({
        title: title.trim(),
        body,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      if ("error" in res) toast.error(t(res.error));
      else router.push(`/qna/${res.id}`);
    });
  }

  return (
    <div className="space-y-5 rounded-xl border border-yt-outline bg-yt-raised p-5 sm:p-6">
      <div>
        <label className="block text-sm font-semibold text-yt-text">
          {t("qna.ask.titleLabel")}
        </label>
        <p className="mt-0.5 text-xs text-yt-text2">{t("qna.ask.titleHint")}</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("qna.ask.titlePlaceholder")}
          className="mt-2 w-full rounded-lg border border-yt-outline bg-yt-base px-3 py-2.5 text-sm text-yt-text outline-none focus:border-yt-text placeholder:text-yt-text2"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-yt-text">{t("qna.ask.bodyLabel")}</label>
        <p className="mt-0.5 text-xs text-yt-text2">{t("qna.ask.bodyHint")}</p>
        <div className="mt-2">
          <RichEditor
            value={body}
            onChange={setBody}
            placeholder={t("qna.ask.bodyPlaceholder")}
            minRows={9}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-yt-text">{t("qna.ask.tagsLabel")}</label>
        <p className="mt-0.5 text-xs text-yt-text2">{t("qna.ask.tagsHint")}</p>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t("qna.tagsPlaceholder")}
          className="mt-2 w-full rounded-lg border border-yt-outline bg-yt-base px-3 py-2.5 text-sm text-yt-text outline-none focus:border-yt-text placeholder:text-yt-text2"
        />
      </div>
      <div className="flex justify-end border-t border-yt-outline pt-4">
        <button
          onClick={submit}
          disabled={pending || !title.trim() || !hasRteContent(body)}
          className="h-10 rounded-full bg-yt-cta px-6 text-sm font-medium text-yt-cta-text hover:opacity-90 disabled:bg-yt-chip disabled:text-yt-text2 disabled:opacity-100"
        >
          {pending ? t("common.processing") : t("qna.ask.submit")}
        </button>
      </div>
    </div>
  );
}
