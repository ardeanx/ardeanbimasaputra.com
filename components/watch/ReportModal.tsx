"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { createReportAction } from "@/app/(shell)/report-actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { REPORT_REASONS } from "@/lib/report-reasons";

export default function ReportModal({
  postId,
  open,
  onClose,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);

  const close = useCallback(() => {
    setReason(null);
    setDetail("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;

  async function submit() {
    if (!reason || pending) return;
    setPending(true);
    const res = await createReportAction({ postId, reason, detail });
    setPending(false);
    if ("error" in res) {
      if (res.error === "report.errorAuth") {
        close();
        openAuthModal("signin");
      } else {
        toast.error(t(res.error));
      }
      return;
    }
    toast.success(t("report.done"));
    close();
  }

  return createPortal(
    <div className="fixed inset-0 z-[130] grid place-items-center p-4">
      <button
        aria-label={t("common.close")}
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 bg-black/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("report.title")}
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-2xl bg-yt-raised p-5 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">{t("report.title")}</h2>
        <div role="radiogroup" className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {REPORT_REASONS.map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={reason === key}
              onClick={() => setReason(key)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-yt-hover"
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                  reason === key ? "border-yt-cta" : "border-yt-text2"
                }`}
              >
                {reason === key && <span className="h-2.5 w-2.5 rounded-full bg-yt-cta" />}
              </span>
              {t("report.reason." + key)}
            </button>
          ))}
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t("report.detailPlaceholder")}
          rows={3}
          className="mt-4 w-full resize-none rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm outline-none focus:border-yt-cta"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="h-10 rounded-full px-4 text-sm font-medium hover:bg-yt-hover"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!reason || pending}
            className="h-10 rounded-full bg-yt-cta px-5 text-sm font-medium text-yt-cta-text disabled:opacity-50"
          >
            {t("report.submit")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
