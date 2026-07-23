"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { DownloadIcon, MoreVertIcon } from "@/components/shell/icons";
import ReportModal from "@/components/watch/ReportModal";

export default function MoreMenu({
  postId,
  mediaUrl,
  title,
}: {
  postId: string;
  mediaUrl: string | null;
  title: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("aria.more")}
        onClick={() => setOpen((o) => !o)}
        className="grid h-10 w-10 place-items-center rounded-full bg-yt-chip hover:bg-yt-chip-hover"
      >
        <MoreVertIcon width={24} height={24} />
      </button>

      {open && (
        <>
          <button
            aria-label={t("common.close")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl bg-yt-menu py-1 shadow-[0_4px_32px_rgba(0,0,0,0.25)]">
            {mediaUrl ? (
              <a
                href={mediaUrl}
                download={title}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-yt-hover"
              >
                <DownloadIcon width={20} height={20} />
                {t("watch.download")}
              </a>
            ) : (
              <span className="flex items-center gap-3 px-4 py-2.5 text-sm text-yt-text2 opacity-60">
                <DownloadIcon width={20} height={20} />
                {t("watch.download")}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setReportOpen(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-yt-hover"
            >
              <Flag width={20} height={20} strokeWidth={1.5} />
              {t("watch.report")}
            </button>
          </div>
        </>
      )}

      <ReportModal postId={postId} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
