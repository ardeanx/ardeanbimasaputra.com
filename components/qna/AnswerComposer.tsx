"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAnswerAction } from "@/app/(shell)/qna/actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { hasRteContent } from "@/components/qna/QnaBody";
import RichEditor from "@/components/rte/RichEditor";
import { toast } from "sonner";

export default function AnswerComposer({
  questionId,
  isLoggedIn,
}: {
  questionId: string;
  isLoggedIn: boolean;
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
    if (!hasRteContent(body) || pending) return;
    start(async () => {
      const res = await createAnswerAction({ questionId, body });
      if ("error" in res) toast.error(t(res.error));
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border border-yt-outline bg-yt-raised p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-yt-text">{t("qna.answer.title")}</h2>
      <div className="mt-3">
        <RichEditor
          value={body}
          onChange={setBody}
          placeholder={t("qna.answer.placeholder")}
          minRows={7}
        />
      </div>
      <button
        onClick={submit}
        disabled={pending || !hasRteContent(body)}
        className="mt-3 h-10 rounded-full bg-yt-cta px-6 text-sm font-medium text-yt-cta-text hover:opacity-90 disabled:bg-yt-chip disabled:text-yt-text2 disabled:opacity-100"
      >
        {pending ? t("common.processing") : t("qna.answer.submit")}
      </button>
    </div>
  );
}
