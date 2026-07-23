import { Plus } from "lucide-react";
import Link from "next/link";
import CouponManager from "@/components/studio/CouponManager";
import StudioTabs from "@/components/studio/StudioTabs";
import { listCoupons } from "@/lib/coupons";
import { fmtPrice } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { listAllProducts } from "@/lib/products";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const KIND_LABEL_KEYS: Record<string, string> = {
  DIGITAL: "studio.produk.kindDigital",
  SOURCE_CODE: "studio.produk.kindSourceCode",
  PHYSICAL: "studio.produk.kindPhysical",
  SERVICE: "studio.produk.kindService",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  DRAFT: "studio.produk.statusDraft",
  PUBLISHED: "studio.produk.statusPublished",
  ARCHIVED: "studio.produk.statusArchived",
};

export default async function StudioProduk({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdmin();
  const t = await getT();
  const { view } = await searchParams;
  const active = view === "kupon" ? "kupon" : "produk";

  const tabs = [
    { key: "produk", label: t("studio.produk.tabProducts") },
    { key: "kupon", label: t("studio.produk.tabCoupons") },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("studio.produk.title")}</h1>
        {active === "produk" && (
          <Link
            href="/studio/produk/new"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-yt-cta px-4 text-sm font-medium text-white"
          >
            <Plus size={20} /> {t("studio.produk.newProduct")}
          </Link>
        )}
      </div>

      <StudioTabs tabs={tabs} param="view" />

      {active === "kupon" ? <CouponsPanel /> : <ProductsPanel />}
    </div>
  );
}

async function ProductsPanel() {
  const t = await getT();
  const rows = await listAllProducts();

  if (rows.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-yt-text2">{t("studio.produk.emptyProducts")}</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-yt-outline">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-yt-outline/60 text-left text-xs text-yt-text2">
            <th className="px-4 py-3 font-medium">{t("studio.produk.colProduct")}</th>
            <th className="px-4 py-3 font-medium">{t("studio.produk.colKind")}</th>
            <th className="px-4 py-3 font-medium">{t("studio.produk.colStatus")}</th>
            <th className="px-4 py-3 font-medium">{t("studio.produk.colPrice")}</th>
            <th className="px-4 py-3 font-medium">{t("studio.produk.colStock")}</th>
            <th className="px-4 py-3 font-medium">{t("studio.produk.colOwner")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-yt-outline/60 last:border-b-0 hover:bg-yt-hover"
            >
              <td className="px-4 py-3">
                <Link href={`/studio/produk/${r.id}`} className="flex items-center gap-3">
                  <span className="block aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-yt-chip">
                    {r.thumbnail && (
                      <img src={r.thumbnail} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="line-clamp-2 font-medium">{r.title}</span>
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-yt-chip px-2.5 py-1 text-xs">
                  {KIND_LABEL_KEYS[r.kind] ? t(KIND_LABEL_KEYS[r.kind]) : r.kind}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    r.status === "PUBLISHED"
                      ? "bg-yt-cta/15 text-yt-cta"
                      : "bg-yt-chip text-yt-text2"
                  }`}
                >
                  {STATUS_LABEL_KEYS[r.status] ? t(STATUS_LABEL_KEYS[r.status]) : r.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {r.price === 0 ? t("store.free") : fmtPrice(r.price)}
              </td>
              <td className="px-4 py-3 text-yt-text2">
                {r.kind === "PHYSICAL" ? (r.stock ?? 0) : "-"}
              </td>
              <td className="px-4 py-3 text-yt-text2">{r.owner.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function CouponsPanel() {
  const t = await getT();
  const coupons = await listCoupons();
  return (
    <div className="max-w-3xl">
      <p className="mb-6 -mt-2 text-sm text-yt-text2">{t("studio.coupon.subtitle")}</p>
      <CouponManager coupons={coupons} />
    </div>
  );
}
