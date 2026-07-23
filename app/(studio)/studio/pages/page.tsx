import { FileText } from "lucide-react";
import Link from "next/link";
import PagesList from "@/components/studio/pages/PagesList";
import { getT } from "@/lib/i18n";
import { listAllPages } from "@/lib/pages";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioPages() {
  await requireAdmin();
  const t = await getT();
  const pages = await listAllPages();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("studio.pages.title")}</h1>
          <p className="mt-0.5 text-sm text-yt-text2">{t("studio.pages.subtitle")}</p>
        </div>
        <Link
          href="/studio/pages/new"
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-yt-cta px-4 text-sm font-medium text-white"
        >
          <FileText size={18} /> {t("studio.pages.create")}
        </Link>
      </div>

      <PagesList
        pages={pages.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          showInFooter: p.showInFooter,
        }))}
      />
    </div>
  );
}
