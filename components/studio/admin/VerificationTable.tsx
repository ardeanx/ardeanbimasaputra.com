"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveVerificationAction,
  rejectVerificationAction,
} from "@/app/(studio)/studio/verification/actions";
import { useLocale, useT } from "@/components/i18n/I18nProvider";
import { askConfirm } from "@/components/ui/dialog";

export type VerificationRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  links: string[];
  createdAt: string;
  requesterId: string;
  name: string;
  username: string | null;
  image: string | null;
};

const STATUS_KEY: Record<VerificationRow["status"], string> = {
  PENDING: "studio.verification.statusPending",
  APPROVED: "studio.verification.statusApproved",
  REJECTED: "studio.verification.statusRejected",
};

export default function VerificationTable({ data }: { data: VerificationRow[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  async function approve(r: VerificationRow) {
    setBusy(r.id);
    const res = await approveVerificationAction(r.id);
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(t("studio.verification.approved", { name: r.name }));
    router.refresh();
  }

  async function reject(r: VerificationRow) {
    const ok = await askConfirm({
      title: t("studio.verification.rejectTitle", { name: r.name }),
      body: t("studio.verification.rejectBody"),
      confirmLabel: t("studio.verification.reject"),
      danger: true,
    });
    if (!ok) return;
    setBusy(r.id);
    const res = await rejectVerificationAction(r.id);
    setBusy(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(t("studio.verification.rejected", { name: r.name }));
    router.refresh();
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-yt-outline bg-yt-raised px-4 py-10 text-center text-sm text-yt-text2">
        {t("studio.verification.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <div key={r.id} className="rounded-xl border border-yt-outline bg-yt-raised p-4">
          <div className="flex flex-wrap items-start gap-3">
            {r.image ? (
              <img src={r.image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yt-chip text-sm font-medium">
                {r.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{r.name}</span>
                {r.username && (
                  <span className="truncate text-xs text-yt-text2">@{r.username}</span>
                )}
                <span
                  className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "PENDING"
                      ? "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400"
                      : r.status === "APPROVED"
                        ? "bg-green-600/15 text-green-500"
                        : "bg-red-600/15 text-red-500"
                  }`}
                >
                  {t(STATUS_KEY[r.status])}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-yt-text2">{formatDate(r.createdAt)}</p>
              {r.message && <p className="mt-2 whitespace-pre-wrap text-sm">{r.message}</p>}
              {r.links.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {r.links.map((l) => (
                    <li key={l}>
                      <a
                        href={l}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="break-all text-sm text-yt-cta hover:underline"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {r.status === "PENDING" && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => approve(r)}
                disabled={busy === r.id}
                className="h-8 rounded-full bg-yt-cta px-3 text-xs font-medium text-yt-cta-text disabled:opacity-50"
              >
                {t("studio.verification.approve")}
              </button>
              <button
                type="button"
                onClick={() => reject(r)}
                disabled={busy === r.id}
                className="h-8 rounded-full border border-red-600/40 px-3 text-xs font-medium text-red-500 hover:bg-red-600/10 disabled:opacity-50"
              >
                {t("studio.verification.reject")}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
