import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderStatusRefresh from "@/components/store/OrderStatusRefresh";
import { fmtPrice } from "@/lib/format";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { getOrderFor } from "@/lib/store";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

const STATUS_KEY: Record<string, string> = {
  PENDING: "order.status.pending",
  PAID: "order.status.paid",
  FAILED: "order.status.failed",
  EXPIRED: "order.status.expired",
  REFUNDED: "order.status.refunded",
};

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/?signin=1");
  const t = await getT();
  const fmt = await getFmt();
  const o = await getOrderFor(id, session.user.id);
  if (!o) notFound();

  const bank = (await getSettings()).integrations.bankTransfer;
  const isBankPending = o.status === "PENDING" && !o.snapToken && bank.enabled;

  return (
    <div className="mx-auto max-w-xl px-6 py-6">
      <Link href="/orders" className="text-sm text-yt-text2 hover:text-yt-text">
        ← {t("menu.purchases")}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{t("order.receipt")}</h1>

      <div className="mt-4 space-y-2 rounded-xl border border-yt-outline p-5 text-sm">
        <Row label={t("order.id")} value={o.id} mono />
        <Row label={t("order.product")} value={o.product?.title ?? o.title} />
        <Row label={t("order.amount")} value={fmtPrice(o.amount)} />
        <Row
          label={t("order.statusLabel")}
          value={STATUS_KEY[o.status] ? t(STATUS_KEY[o.status]) : o.status}
        />
        <Row label={t("order.created")} value={fmt.ago(o.createdAt)} />
        {o.paidAt && <Row label={t("order.paidAt")} value={fmt.ago(o.paidAt)} />}
      </div>

      {o.status === "PAID" && (
        <p className="mt-4 rounded-xl bg-yt-chip px-4 py-3 text-sm text-green-600 dark:text-green-400">
          {t("order.paidNotice")}
        </p>
      )}
      {isBankPending && (
        <div className="mt-4 rounded-xl border border-yt-outline p-5 text-sm">
          <h2 className="text-base font-semibold">{t("order.bankInstructions")}</h2>
          <div className="mt-3 space-y-2">
            <Row label={t("order.bank")} value={bank.bankName || "-"} />
            <div className="flex justify-between gap-4">
              <span className="text-yt-text2">{t("order.accountNumber")}</span>
              <span className="flex items-center gap-1 text-right font-mono text-xs font-medium">
                {bank.accountNumber || "-"}
                {bank.accountNumber && <CopyButton text={bank.accountNumber} />}
              </span>
            </div>
            <Row label={t("order.accountName")} value={bank.accountName || "-"} />
            <Row label={t("order.transferTotal")} value={fmtPrice(o.amount)} />
          </div>
          {bank.instructions && (
            <p className="mt-3 whitespace-pre-line text-yt-text2">{bank.instructions}</p>
          )}
          <p className="mt-3 text-xs text-yt-text2">{t("order.manualConfirm")}</p>
        </div>
      )}
      {o.status === "PENDING" && !isBankPending && <OrderStatusRefresh orderId={o.id} />}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-yt-text2">{label}</span>
      <span className={`text-right font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
