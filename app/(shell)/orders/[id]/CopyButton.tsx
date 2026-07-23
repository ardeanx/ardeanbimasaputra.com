"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/components/i18n/I18nProvider";

export default function CopyButton({ text }: { text: string }) {
  const t = useT();
  return (
    <button
      type="button"
      aria-label={t("aria.copy")}
      onClick={() => {
        navigator.clipboard
          .writeText(text)
          .then(() => toast.success(t("toast.copied")))
          .catch(() => toast.error(t("toast.copyFailed")));
      }}
      className="rounded p-1 text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
    >
      <Copy size={14} />
    </button>
  );
}
