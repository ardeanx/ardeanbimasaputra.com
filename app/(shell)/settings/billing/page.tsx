import { desc, eq } from "drizzle-orm";
import { Package, Receipt } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import { entitlement, product } from "@/db/schema";
import { db } from "@/lib/db";
import { fmtPrice } from "@/lib/format";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { listOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { key: string; cls: string }> = {
  PENDING: { key: "order.short.pending", cls: "bg-yt-chip text-yt-text2" },
  PAID: {
    key: "order.status.paid",
    cls: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  FAILED: {
    key: "order.status.failed",
    cls: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  EXPIRED: { key: "order.status.expired", cls: "bg-yt-chip text-yt-text2" },
  REFUNDED: { key: "order.status.refunded", cls: "bg-yt-chip text-yt-text2" },
};

export default async function BillingSettingsPage() {
  const sess = await getSession();
  if (!sess) redirect("/?signin=1");
  const t = await getT();
  const fmt = await getFmt();

  const [orders, owned] = await Promise.all([
    listOrders(sess.user.id),
    db
      .select({
        slug: product.slug,
        title: product.title,
        thumbnail: product.thumbnail,
      })
      .from(entitlement)
      .innerJoin(product, eq(product.id, entitlement.productId))
      .where(eq(entitlement.userId, sess.user.id))
      .orderBy(desc(entitlement.createdAt)),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("settings.purchaseHistory")}</h2>
        {orders.length === 0 ? (
          <EmptyState icon={<Receipt />} title={t("order.empty")} className="py-8" />
        ) : (
          <div className="mt-3 space-y-2">
            {orders.map((o) => {
              const s = STATUS[o.status] ?? {
                key: "",
                cls: "bg-yt-chip text-yt-text2",
              };
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-yt-outline px-4 py-3 text-sm hover:bg-yt-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.title}</p>
                    <p className="text-xs text-yt-text2">{fmt.ago(o.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-medium">{fmtPrice(o.amount)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                      {s.key ? t(s.key) : o.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("settings.ownedProducts")}</h2>
        {owned.length === 0 ? (
          <EmptyState icon={<Package />} title={t("settings.noOwnedProducts")} className="py-8" />
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {owned.map((p) => (
              <Link
                key={p.slug}
                href={`/store/${p.slug}`}
                className="flex items-center gap-3 rounded-lg border border-yt-outline p-2 hover:bg-yt-hover"
              >
                <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-yt-hover">
                  {p.thumbnail && (
                    <img src={p.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
