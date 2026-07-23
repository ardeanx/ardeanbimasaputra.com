"use client";

import { useState, useTransition } from "react";
import { toggleFollowAction } from "@/app/(shell)/actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useFmt, useT } from "@/components/i18n/I18nProvider";

export default function SubscribeButton({
  targetUserId,
  viewerId,
  initialFollowing,
  initialCount,
  showCount,
}: {
  targetUserId: string;
  viewerId: string | null;
  initialFollowing: boolean;
  initialCount: number;
  showCount?: boolean;
}) {
  const t = useT();
  const fmt = useFmt();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  if (viewerId === targetUserId) return null;

  const label = following ? t("follow.following") : t("follow.follow");
  const cls = following
    ? "bg-yt-chip text-yt-text hover:bg-yt-chip-hover"
    : "bg-yt-btn text-yt-btn-text";

  const btn = viewerId ? (
    <button
      onClick={() =>
        start(async () => {
          const res = await toggleFollowAction(targetUserId);
          if ("count" in res) {
            setFollowing(res.following);
            setCount(res.count);
          }
        })
      }
      disabled={pending}
      className={`h-10 rounded-full px-4 text-sm font-medium ${cls}`}
    >
      {label}
    </button>
  ) : (
    <button
      onClick={() => openAuthModal("signin")}
      className="grid h-10 place-items-center rounded-full bg-yt-btn px-4 text-sm font-medium text-yt-btn-text"
    >
      {t("follow.follow")}
    </button>
  );

  if (!showCount) return btn;
  return (
    <div className="flex items-center gap-3">
      {btn}
      <span className="text-sm text-yt-text2">
        {t("follow.followers", { n: fmt.compact(count) })}
      </span>
    </div>
  );
}
