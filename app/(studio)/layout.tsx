import { redirect } from "next/navigation";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import StudioShell from "@/components/studio/StudioShell";
import { DEFAULT_LOCALE, getLocale, loadDict } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const [session, settings, locale] = await Promise.all([getSession(), getSettings(), getLocale()]);
  if (!session) redirect("/?signin=1");

  const [dict, fallbackDict] = await Promise.all([loadDict(locale), loadDict(DEFAULT_LOCALE)]);

  const u = session.user as {
    name: string;
    image?: string | null;
    username?: string | null;
    role?: string | null;
  };

  return (
    <I18nProvider dict={dict} fallback={fallbackDict} locale={locale}>
      <StudioShell
        isAdmin={u.role === "admin"}
        name={u.name}
        username={u.username ?? null}
        image={u.image ?? null}
        logo={settings.appearance.logo}
        appName={settings.system.appName}
      >
        {children}
      </StudioShell>
    </I18nProvider>
  );
}
