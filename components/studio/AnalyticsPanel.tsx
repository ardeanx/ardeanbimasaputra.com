import { BarChart3 } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import { channelAnalytics } from "@/lib/analytics";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";

export default async function AnalyticsPanel({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const a = await channelAnalytics(userId, isAdmin);
  const maxN = Math.max(1, ...a.days.map((d) => d.n));
  const t = await getT();
  const fmt = await getFmt();

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t("studio.metric.totalViews")} value={fmt.compact(a.totalViews)} />
        <Stat label={t("studio.analytics.followers")} value={fmt.compact(a.subscribers)} />
        <Stat label={t("studio.metric.likes")} value={fmt.compact(a.likes)} />
        <Stat label={t("studio.metric.comments")} value={fmt.compact(a.comments)} />
      </div>

      <section className="mt-6 rounded-xl border border-yt-outline bg-yt-raised p-4">
        <h2 className="mb-6 text-sm font-medium text-yt-text2">{t("studio.analytics.views28d")}</h2>
        <div className="flex h-40 items-end gap-1">
          {a.days.map((d) => (
            <div key={d.day} className="group relative flex-1">
              <div
                className="mx-auto w-full rounded-t bg-yt-cta"
                style={{
                  height: `${(d.n / maxN) * 100}%`,
                  minHeight: d.n > 0 ? 2 : 0,
                }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-yt-menu px-1.5 py-0.5 text-[10px] opacity-0 shadow group-hover:opacity-100">
                {d.n} · {d.day.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-yt-outline bg-yt-raised p-4">
        <h2 className="mb-3 text-sm font-medium text-yt-text2">{t("studio.dash.top")}</h2>
        {a.top.length === 0 ? (
          <EmptyState
            icon={<BarChart3 />}
            title={t("empty.analytics.title")}
            description={t("empty.analytics.desc")}
          />
        ) : (
          <ul className="space-y-3">
            {a.top.map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="block aspect-video w-16 shrink-0 overflow-hidden rounded bg-yt-hover">
                  {p.thumbnail && (
                    <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <Link
                  href={`/studio/${p.id}`}
                  className="line-clamp-1 flex-1 text-sm font-medium hover:text-yt-cta"
                >
                  {p.title}
                </Link>
                <span className="shrink-0 text-sm text-yt-text2">
                  {fmt.views(p.viewCount, p.type)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-yt-outline bg-yt-raised p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-yt-text2">{label}</p>
    </div>
  );
}
