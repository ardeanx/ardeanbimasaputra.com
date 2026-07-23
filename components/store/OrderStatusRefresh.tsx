"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { checkOrderStatusAction } from "@/app/(shell)/store-actions";

export default function OrderStatusRefresh({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          await checkOrderStatusAction(orderId);
          router.refresh();
        })
      }
      disabled={pending}
      className="mt-4 h-9 rounded-full bg-yt-chip px-4 text-sm font-medium hover:bg-yt-chip-hover disabled:opacity-50"
    >
      {pending ? "Memeriksa…" : "Perbarui status pembayaran"}
    </button>
  );
}
