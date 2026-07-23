"use client";

import { useTransition } from "react";
import { moderateAction } from "@/app/(studio)/studio/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { askConfirm } from "@/components/ui/dialog";

export default function ModerateButtons({ id }: { id: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <button
        onClick={() => start(() => moderateAction(id, "approve"))}
        disabled={pending}
        className="h-8 rounded-full bg-yt-cta px-3 text-xs font-medium text-yt-cta-text disabled:opacity-50"
      >
        {t("studio.mod.approve")}
      </button>
      <button
        onClick={() => {
          askConfirm({
            title: t("studio.mod.rejectTitle"),
            body: t("studio.mod.rejectBody"),
            confirmLabel: t("studio.mod.rejectConfirm"),
            danger: true,
          }).then((ok) => {
            if (ok) start(() => moderateAction(id, "reject"));
          });
        }}
        disabled={pending}
        className="h-8 rounded-full bg-yt-chip px-3 text-xs font-medium text-red-500 hover:bg-yt-chip-hover disabled:opacity-50"
      >
        {t("studio.mod.reject")}
      </button>
    </div>
  );
}
