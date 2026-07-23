import { desc, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ModerateButtons from "@/components/studio/ModerateButtons";
import EmptyState from "@/components/ui/EmptyState";
import { post } from "@/db/schema";
import { db } from "@/lib/db";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Moderation() {
  const session = await getSession();
  const isAdmin = (session!.user as { role?: string | null }).role === "admin";
  if (!isAdmin) redirect("/studio");

  const t = await getT();
  const fmt = await getFmt();
  const rows = await db.query.post.findMany({
    where: eq(post.status, "REVIEW"),
    with: { author: true, category: true },
    orderBy: [desc(post.updatedAt)],
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{t("studio.mod.title")}</h1>
      <p className="mb-6 text-sm text-yt-text2">{t("studio.mod.sub")}</p>

      {rows.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 />}
          title={t("studio.mod.empty")}
          description={t("empty.mod.desc")}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 rounded-xl border border-yt-outline p-3"
            >
              <span className="relative block aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-yt-hover">
                {r.thumbnail && (
                  <img src={r.thumbnail} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/studio/${r.id}`}
                  className="line-clamp-1 font-medium hover:text-yt-cta"
                >
                  {r.title}
                </Link>
                <p className="mt-0.5 text-xs text-yt-text2">
                  {r.author.name} · {r.category?.name ?? t("studio.common.noCategory")} ·{" "}
                  {fmt.ago(r.updatedAt)}
                </p>
              </div>
              <ModerateButtons id={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
