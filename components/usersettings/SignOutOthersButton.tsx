"use client";

import { useT } from "@/components/i18n/I18nProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { signOutOtherSessionsAction } from "@/app/(shell)/settings/actions";
import { askConfirm } from "@/components/ui/dialog";

export default function SignOutOthersButton() {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function run() {
    const ok = await askConfirm({
      title: t("usersettings.signOutOthersTitle"),
      body: t("usersettings.signOutOthersBody"),
      confirmLabel: t("usersettings.signOutOthersConfirm"),
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await signOutOtherSessionsAction();
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(t("usersettings.signOutOthersDone"));
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
      {pending ? t("usersettings.processing") : t("usersettings.signOutOthers")}
    </button>
  );
}
