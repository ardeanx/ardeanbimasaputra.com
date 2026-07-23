import VerificationTable, {
  type VerificationRow,
} from "@/components/studio/admin/VerificationTable";
import { getT } from "@/lib/i18n";
import { requireAdmin } from "@/lib/session";
import { listVerificationRequests } from "@/lib/verification";

export const dynamic = "force-dynamic";

export default async function StudioVerification() {
  await requireAdmin();
  const t = await getT();
  const rows = await listVerificationRequests();

  const data: VerificationRow[] = rows.map((r) => ({
    id: r.id,
    status: r.status,
    message: r.message,
    links: r.links,
    createdAt: r.createdAt.toISOString(),
    requesterId: r.requesterId,
    name: r.name,
    username: r.username,
    image: r.image,
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("studio.verification.title")}</h1>
        <p className="mt-0.5 text-sm text-yt-text2">{t("studio.verification.subtitle")}</p>
      </div>
      <VerificationTable data={data} />
    </div>
  );
}
