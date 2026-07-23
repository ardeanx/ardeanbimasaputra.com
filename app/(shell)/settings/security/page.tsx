import { redirect } from "next/navigation";
import PasswordForm from "@/components/usersettings/PasswordForm";
import SignOutOthersButton from "@/components/usersettings/SignOutOthersButton";
import { db } from "@/lib/db";
import { getFmt } from "@/lib/format-server";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const sess = await getSession();
  if (!sess) redirect("/?signin=1");
  const t = await getT();
  const fmt = await getFmt();
  const sessions = await db.query.session.findMany({
    where: (s, { eq }) => eq(s.userId, sess.user.id),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <h2 className="text-base font-semibold">{t("settings.changePassword")}</h2>
        <p className="mt-1 text-sm text-yt-text2">{t("settings.changePasswordNote")}</p>
        <PasswordForm />
      </section>

      <section className="rounded-xl border border-yt-outline bg-yt-raised p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t("settings.activeSessions")}</h2>
          {sessions.length > 1 && <SignOutOthersButton />}
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-yt-outline text-yt-text2">
                <th className="py-2 pr-4 font-medium">{t("settings.device")}</th>
                <th className="py-2 pr-4 font-medium">{t("settings.ipAddress")}</th>
                <th className="py-2 font-medium">{t("settings.signedIn")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yt-outline">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="max-w-[280px] truncate" title={s.userAgent ?? ""}>
                        {s.userAgent ?? t("settings.unknown")}
                      </span>
                      {s.token === sess.session.token && (
                        <span className="shrink-0 rounded-full bg-yt-hover px-2 py-0.5 text-xs font-medium">
                          {t("settings.thisSession")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">{s.ipAddress || "-"}</td>
                  <td className="py-2.5 whitespace-nowrap">{fmt.ago(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
