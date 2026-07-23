"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { acceptAnswerAction } from "@/app/(shell)/qna/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { askConfirm } from "@/components/ui/dialog";

export default function AcceptButton({
  questionId,
  answerId,
  accepted,
  canAccept,
}: {
  questionId: string;
  answerId: string;
  accepted: boolean;
  canAccept: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!canAccept) {
    if (!accepted) return null;
    return (
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 text-green-500"
        title={t("qna.accepted")}
        aria-label={t("qna.accepted")}
      >
        <Check size={22} strokeWidth={3} />
      </span>
    );
  }

  function toggle() {
    if (pending) return;
    start(async () => {
      if (!accepted) {
        const ok = await askConfirm({ title: t("qna.accept.confirm") });
        if (!ok) return;
      }
      const res = await acceptAnswerAction(questionId, answerId);
      if ("error" in res) toast.error(t(res.error));
      else router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={accepted}
      title={accepted ? t("qna.accepted") : t("qna.accept")}
      aria-label={accepted ? t("qna.accepted") : t("qna.accept")}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
        accepted
          ? "border-green-500/40 bg-green-500/15 text-green-500"
          : "border-yt-outline text-yt-text2 hover:border-green-500/50 hover:text-green-500"
      }`}
    >
      <Check size={22} strokeWidth={3} />
    </button>
  );
}
