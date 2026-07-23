"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  checkOrderStatusAction,
  createBankTransferOrderAction,
  createOrderAction,
  validateCouponAction,
} from "@/app/(shell)/store-actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { fmtPrice } from "@/lib/format";

type Snap = {
  pay: (token: string, opts: Record<string, (result?: unknown) => void>) => void;
};
declare global {
  interface Window {
    snap?: Snap;
  }
}

function loadSnap(production: boolean, clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const s = document.createElement("script");
    s.src = production
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("gagal"));
    document.body.appendChild(s);
  });
}

export default function BuyButton({
  productId,
  price,
  viewerId,
  clientKey,
  production,
  midtransEnabled,
  bankEnabled,
}: {
  productId: string;
  price: number;
  viewerId: string | null;
  clientKey: string;
  production: boolean;
  midtransEnabled: boolean;
  bankEnabled: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; final: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canMidtrans = midtransEnabled && clientKey.length > 0;

  if (!viewerId) {
    return (
      <button
        onClick={() => openAuthModal("signin")}
        className="flex h-9 items-center rounded-full bg-yt-cta px-4 text-sm font-medium text-yt-cta-text"
      >
        {t("store.signInToBuy", { price: fmtPrice(price) })}
      </button>
    );
  }
  if (!canMidtrans && !bankEnabled) {
    return (
      <span className="flex h-9 items-center rounded-full bg-yt-chip px-4 text-sm text-yt-text2">
        {t("store.paymentInactive")}
      </span>
    );
  }

  const finalPrice = applied ? applied.final : price;

  function applyCoupon() {
    setMsg(null);
    start(async () => {
      const v = await validateCouponAction(productId, code);
      if ("error" in v) {
        setApplied(null);
        setMsg(v.error);
      } else {
        setApplied({ code: v.code, final: v.finalAmount });
        setMsg(t("store.couponSaved", { amount: fmtPrice(v.discount) }));
      }
    });
  }

  function finish(orderId: string) {
    start(async () => {
      await checkOrderStatusAction(orderId);
      setOpen(false);
      router.refresh();
    });
  }

  function payMidtrans() {
    setError(null);
    start(async () => {
      const res = await createOrderAction(productId, applied?.code);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      if (res.token === null) {
        finish(res.orderId);
        return;
      }
      try {
        await loadSnap(production, clientKey);
      } catch {
        setError(t("store.payLoadFailed"));
        return;
      }
      window.snap?.pay(res.token, {
        onSuccess: () => finish(res.orderId),
        onPending: () => finish(res.orderId),
        onError: () => setError(t("store.payFailed")),
        onClose: () => {},
      });
    });
  }

  function payBank() {
    setError(null);
    start(async () => {
      const res = await createBankTransferOrderAction(productId, applied?.code);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.push(`/orders/${res.orderId}`);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center rounded-full bg-yt-cta px-4 text-sm font-medium text-yt-cta-text"
      >
        {t("store.buyPrice", { price: fmtPrice(price) })}
      </button>
      {open && (
        <>
          <button
            aria-label={t("aria.close")}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50 w-72 rounded-xl bg-yt-menu p-4 shadow-[0_4px_32px_rgba(0,0,0,0.25)]">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-yt-text2">{t("store.total")}</span>
              <span className="text-lg font-semibold">
                {applied && applied.final !== price && (
                  <span className="mr-2 text-sm font-normal text-yt-text2 line-through">
                    {fmtPrice(price)}
                  </span>
                )}
                {fmtPrice(finalPrice)}
              </span>
            </div>
            <div className="flex gap-1">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("store.couponPlaceholder")}
                className="min-w-0 flex-1 rounded border border-yt-outline bg-transparent px-2 py-1.5 text-sm uppercase outline-none focus:border-yt-cta"
              />
              <button
                onClick={applyCoupon}
                disabled={pending || !code.trim()}
                className="rounded bg-yt-chip px-3 text-sm font-medium hover:bg-yt-chip-hover disabled:opacity-50"
              >
                {t("store.apply")}
              </button>
            </div>
            {msg && (
              <p
                className={`mt-1 text-xs ${
                  applied ? "text-green-600 dark:text-green-400" : "text-red-500"
                }`}
              >
                {msg}
              </p>
            )}
            <div className="mt-3 space-y-2">
              {canMidtrans && (
                <button
                  onClick={payMidtrans}
                  disabled={pending}
                  className="h-10 w-full rounded-full bg-yt-cta text-sm font-medium text-yt-cta-text disabled:opacity-50"
                >
                  {pending
                    ? t("common.processing")
                    : bankEnabled
                      ? t("store.payMidtrans")
                      : t("store.payPrice", { price: fmtPrice(finalPrice) })}
                </button>
              )}
              {bankEnabled && (
                <button
                  onClick={payBank}
                  disabled={pending}
                  className={`h-10 w-full rounded-full text-sm font-medium disabled:opacity-50 ${
                    canMidtrans ? "bg-yt-chip hover:bg-yt-chip-hover" : "bg-yt-cta text-yt-cta-text"
                  }`}
                >
                  {pending ? t("common.processing") : t("store.bankTransfer")}
                </button>
              )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
