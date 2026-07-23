import { redirect } from "next/navigation";
import SettingsNav from "@/components/usersettings/SettingsNav";
import { getT } from "@/lib/i18n";
import { getSession } from "@/lib/session";

export default async function UserSettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/?signin=1");
  const t = await getT();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
      <div className="mt-5 flex flex-col gap-6 md:flex-row md:gap-8">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
