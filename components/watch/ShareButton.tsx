"use client";

import { toast } from "sonner";
import { useT } from "@/components/i18n/I18nProvider";
import { ShareIcon } from "@/components/shell/icons";

export default function ShareButton({ title }: { title: string }) {
  const t = useT();
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("toast.linkCopied"));
    } catch {
      toast.error(t("toast.linkCopyFailed"));
    }
  }

  return (
    <button
      onClick={share}
      aria-label={t("card.share")}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-yt-chip text-sm font-medium hover:bg-yt-chip-hover sm:w-auto sm:justify-start sm:gap-1.5 sm:px-4"
    >
      <ShareIcon width={24} height={24} />
      <span className="hidden sm:inline">{t("card.share")}</span>
    </button>
  );
}
