"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { signOutOtherSessionsAction } from "@/app/(shell)/settings/actions";
import { askConfirm } from "@/components/ui/dialog";

export default function SignOutOthersButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function run() {
    const ok = await askConfirm({
      title: "Keluar dari sesi lain?",
      body: "Semua sesi selain sesi ini akan diakhiri.",
      confirmLabel: "Keluar",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await signOutOtherSessionsAction();
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Sesi lain telah diakhiri.");
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="h-9 rounded-full border border-yt-outline px-4 text-sm hover:bg-yt-hover disabled:opacity-50"
    >
      {pending ? "Memproses..." : "Keluar dari sesi lain"}
    </button>
  );
}
