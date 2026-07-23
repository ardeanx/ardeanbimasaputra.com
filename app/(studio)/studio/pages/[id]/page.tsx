import { notFound } from "next/navigation";
import PageForm from "@/components/studio/pages/PageForm";
import { getT } from "@/lib/i18n";
import { getPage } from "@/lib/pages";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const t = await getT();
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold">{t("studio.pages.edit")}</h1>
      <PageForm
        page={{
          id: page.id,
          slug: page.slug,
          title: page.title,
          body: page.body,
          status: page.status,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          ogImage: page.ogImage,
          showInFooter: page.showInFooter,
          sortOrder: page.sortOrder,
        }}
      />
    </div>
  );
}
