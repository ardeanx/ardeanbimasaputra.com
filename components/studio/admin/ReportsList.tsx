"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { resolveReportAction } from "@/app/(shell)/report-actions";
import { useFmt, useT } from "@/components/i18n/I18nProvider";

type Report = {
  id: string;
  reason: string;
  detail: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  post: { id: string; title: string; slug: string } | null;
  reporterName: string | null;
};

const STATUS_STYLES: Record<Report["status"], string> = {
  OPEN: "bg-yt-cta/15 text-yt-cta",
  RESOLVED: "bg-green-500/15 text-green-500",
  DISMISSED: "bg-yt-chip text-yt-text2",
};

export default function ReportsList({ reports }: { reports: Report[] }) {
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const [pending, start] = useTransition();

  const sorted = [...reports].sort((a, b) =>
    a.status === b.status ? 0 : a.status === "OPEN" ? -1 : b.status === "OPEN" ? 1 : 0,
  );

  function act(id: string, status: "RESOLVED" | "DISMISSED") {
    start(async () => {
      const res = await resolveReportAction(id, status);
      if ("error" in res) toast.error(t(res.error));
      else {
        toast.success(
          t(
            status === "RESOLVED"
              ? "studio.content.reportResolved"
              : "studio.content.reportDismissed",
          ),
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {sorted.map((r) => (
        <div key={r.id} className="rounded-xl border border-yt-outline p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-yt-chip px-2.5 py-0.5 text-xs font-medium">
                  {t("report.reason." + r.reason)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                >
                  {t("report.status." + r.status)}
                </span>
              </div>
              {r.post ? (
                <Link
                  href={`/${r.post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-1 text-sm font-medium hover:text-yt-cta"
                >
                  {r.post.title || t("studio.content.untitled")}
                </Link>
              ) : (
                <span className="text-sm text-yt-text2">{t("studio.content.reportDeleted")}</span>
              )}
              {r.detail && <p className="mt-1 text-sm text-yt-text2">{r.detail}</p>}
              <p className="mt-2 text-xs text-yt-text2">
                {r.reporterName ?? t("report.anonymous")} · {fmt.ago(r.createdAt)}
              </p>
            </div>
            {r.status === "OPEN" && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => act(r.id, "RESOLVED")}
                  disabled={pending}
                  className="h-8 rounded-full bg-yt-cta px-3 text-xs font-medium text-yt-cta-text disabled:opacity-50"
                >
                  {t("studio.content.reportResolve")}
                </button>
                <button
                  onClick={() => act(r.id, "DISMISSED")}
                  disabled={pending}
                  className="h-8 rounded-full bg-yt-chip px-3 text-xs font-medium hover:bg-yt-chip-hover disabled:opacity-50"
                >
                  {t("studio.content.reportDismiss")}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
