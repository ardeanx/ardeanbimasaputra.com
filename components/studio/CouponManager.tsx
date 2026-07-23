"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCouponAction,
  deleteCouponAction,
  toggleCouponAction,
} from "@/app/(studio)/studio/coupon-actions";
import { useT } from "@/components/i18n/I18nProvider";
import Select from "@/components/ui/Select";
import { askConfirm } from "@/components/ui/dialog";
import { fmtPrice } from "@/lib/format";

type Coupon = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minAmount: number | null;
  maxUses: number | null;
  uses: number;
  expiresAt: Date | string | null;
  active: boolean;
};

const field =
  "rounded-lg border border-yt-outline bg-transparent px-3 py-2 text-sm outline-none focus:border-yt-cta";

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const t = useT();
  const router = useRouter();
  const [, start] = useTransition();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    const v = Number(value);
    if (!code.trim() || !v) {
      setError(t("studio.coupon.codeValueRequired"));
      return;
    }
    start(async () => {
      const res = await createCouponAction({
        code,
        type,
        value: v,
        minAmount: minAmount ? Number(minAmount) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setCode("");
      setValue("");
      setMaxUses("");
      setMinAmount("");
      setExpiresAt("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="rounded-xl border border-yt-outline bg-yt-raised p-4">
        <h2 className="mb-3 text-sm font-medium text-yt-text2">{t("studio.coupon.create")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("studio.coupon.codePlaceholder")}
            className={`${field} uppercase`}
          />
          <Select
            ariaLabel={t("studio.coupon.type")}
            value={type}
            onChange={(v) => setType(v as "PERCENT" | "FIXED")}
            options={[
              { value: "PERCENT", label: t("studio.coupon.typePercent") },
              { value: "FIXED", label: t("studio.coupon.typeFixed") },
            ]}
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            min={1}
            placeholder={type === "PERCENT" ? "10" : "50000"}
            className={field}
          />
          <input
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            type="number"
            min={0}
            placeholder={t("studio.coupon.minSpend")}
            className={field}
          />
          <input
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            type="number"
            min={1}
            placeholder={t("studio.coupon.quota")}
            className={field}
          />
          <input
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            type="date"
            className={field}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          onClick={create}
          className="mt-3 h-9 rounded-full bg-yt-cta px-4 text-sm font-medium text-white"
        >
          {t("studio.coupon.add")}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-yt-outline text-left text-yt-text2">
            <tr>
              <th className="py-2 font-medium">{t("studio.coupon.colCode")}</th>
              <th className="py-2 font-medium">{t("studio.coupon.colDiscount")}</th>
              <th className="py-2 font-medium">{t("studio.coupon.colUses")}</th>
              <th className="py-2 font-medium">{t("studio.coupon.colStatus")}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-yt-text2">
                  {t("studio.coupon.empty")}
                </td>
              </tr>
            )}
            {coupons.map((c) => (
              <tr key={c.code} className="border-b border-yt-outline/60">
                <td className="py-3 pr-4 font-mono font-medium">{c.code}</td>
                <td className="py-3 pr-4">
                  {c.type === "PERCENT" ? `${c.value}%` : fmtPrice(c.value)}
                </td>
                <td className="py-3 pr-4 text-yt-text2">
                  {c.uses}
                  {c.maxUses ? `/${c.maxUses}` : ""}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.active
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-yt-chip text-yt-text2"
                    }`}
                  >
                    {c.active ? t("studio.coupon.active") : t("studio.coupon.inactive")}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        start(async () => {
                          await toggleCouponAction(c.code, !c.active);
                          router.refresh();
                        })
                      }
                      className="text-yt-cta hover:underline"
                    >
                      {c.active ? t("studio.coupon.deactivate") : t("studio.coupon.activate")}
                    </button>
                    <button
                      onClick={() => {
                        askConfirm({
                          title: t("studio.coupon.deleteTitle", { code: c.code }),
                          confirmLabel: t("common.delete"),
                          danger: true,
                        }).then((ok) => {
                          if (ok)
                            start(async () => {
                              await deleteCouponAction(c.code);
                              router.refresh();
                            });
                        });
                      }}
                      className="text-red-500 hover:underline"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
