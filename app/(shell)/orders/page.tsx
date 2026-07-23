import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import { fmtPrice } from "@/lib/format";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { listOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

const LABEL: Record<string, { key: string; c: string }> = {
  PENDING: {
    key: "order.short.pending",
    c: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  PAID: {
    key: "order.status.paid",
    c: "bg-green-500/15 text-green-600 dark:text-green-400",
  },
  FAILED: { key: "order.status.failed", c: "bg-red-500/15 text-red-500" },
  EXPIRED: { key: "order.status.expired", c: "bg-yt-chip text-yt-text2" },
  REFUNDED: { key: "order.status.refunded", c: "bg-yt-chip text-yt-text2" },
};

export default async function Orders() {
  const session = await getSession();
  if (!session) redirect("/?signin=1");
  const t = await getT();
  const fmt = await getFmt();
  const orders = await listOrders(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("menu.purchases")}</h1>
      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag />}
          title={t("order.empty")}
          action={{ label: t("nav.store"), href: "/store" }}
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const s = LABEL[o.status] ?? { key: "", c: "bg-yt-chip" };
            return (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-xl border border-yt-outline p-3 hover:bg-yt-hover"
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-medium">{o.title}</span>
                    <span className="block text-xs text-yt-text2">{fmt.ago(o.createdAt)}</span>
                  </span>
                  <span className="font-medium">{fmtPrice(o.amount)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.c}`}>
                    {s.key ? t(s.key) : o.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
