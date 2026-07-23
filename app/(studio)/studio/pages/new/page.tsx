import PageForm from "@/components/studio/pages/PageForm";
import { getT } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewPage() {
  await requireAdmin();
  const t = await getT();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold">{t("studio.pages.create")}</h1>
      <PageForm />
    </div>
  );
}
