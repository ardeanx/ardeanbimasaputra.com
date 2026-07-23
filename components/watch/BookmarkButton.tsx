"use client";

import { useState, useTransition } from "react";
import { toggleBookmarkAction } from "@/app/(shell)/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { ClockIcon } from "@/components/shell/icons";

export default function BookmarkButton({
  postId,
  initialSaved,
  disabled,
}: {
  postId: string;
  initialSaved: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => {
        if (disabled) return;
        start(async () => {
          const res = await toggleBookmarkAction(postId);
          if ("saved" in res) setSaved(res.saved);
        });
      }}
      disabled={pending}
      aria-pressed={saved}
      className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium hover:bg-yt-chip-hover ${
        saved ? "bg-yt-cta/15 text-yt-cta" : "bg-yt-chip"
      }`}
    >
      <ClockIcon width={24} height={24} /> {saved ? t("nav.saved") : t("nav.readLater")}
    </button>
  );
}
