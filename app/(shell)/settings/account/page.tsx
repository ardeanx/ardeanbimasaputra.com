import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getVerifyState } from "@/lib/verification";
import RequestVerification from "./RequestVerification";

export const dynamic = "force-dynamic";

const joinDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

const ROLE_KEY: Record<string, string> = {
  admin: "role.admin",
  user: "role.user",
};

export default async function AccountSettingsPage() {
  const sess = await getSession();
  if (!sess) redirect("/?signin=1");
  const t = await getT();
  const role = (sess.user as { role?: string | null }).role ?? "user";
  const { state: verifyState } = await getVerifyState(sess.user.id);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("settings.accountInfo")}</h2>
        <dl className="mt-2 divide-y divide-yt-outline text-sm">
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt className="text-yt-text2">{t("settings.email")}</dt>
            <dd>{sess.user.email}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt className="text-yt-text2">{t("settings.role")}</dt>
            <dd>{t(ROLE_KEY[role] ?? "") || role}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr]">
            <dt className="text-yt-text2">{t("settings.joinDate")}</dt>
            <dd>{joinDate.format(new Date(sess.user.createdAt))}</dd>
          </div>
        </dl>
      </section>

      <RequestVerification state={verifyState} />
    </div>
  );
}
