import { eq } from "drizzle-orm";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import ShellClient from "@/components/shell/ShellClient";
import { category, follow, user } from "@/db/schema";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE, getLocale, getT, loadDict } from "@/lib/i18n";
import { listFooterPages } from "@/lib/pages";
import { getSession } from "@/lib/session";
import { getSettings, oauthFlags } from "@/lib/settings";

const SOCIAL_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  reddit: "Reddit",
  x: "X",
  telegram: "Telegram",
  linkedin: "LinkedIn",
};

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const [session, settings, locale] = await Promise.all([getSession(), getSettings(), getLocale()]);
  const isAdmin = (session?.user as { role?: string | null } | undefined)?.role === "admin";

  if (settings.system.maintenance && !isAdmin) {
    const t = await getT();
    return (
      <main className="grid min-h-screen place-items-center bg-yt-base px-6 text-center text-yt-text">
        <div>
          <h1 className="text-3xl font-bold">
            {t("maintenance.title", { app: settings.system.appName })}
          </h1>
          <p className="mt-3 text-sm text-yt-text2">{t("maintenance.body")}</p>
        </div>
      </main>
    );
  }

  const [dict, fallbackDict] = await Promise.all([loadDict(locale), loadDict(DEFAULT_LOCALE)]);

  const [subs, cats, footerPages] = await Promise.all([
    session
      ? db
          .select({
            name: user.name,
            username: user.username,
            image: user.image,
          })
          .from(follow)
          .innerJoin(user, eq(user.id, follow.followingId))
          .where(eq(follow.followerId, session.user.id))
          .limit(10)
      : Promise.resolve([]),
    db.select({ name: category.name, slug: category.slug }).from(category).orderBy(category.name),
    settings.appearance.footerShowPages ? listFooterPages() : Promise.resolve([]),
  ]);

  const socials = settings.appearance.footerShowSocials
    ? Object.entries(settings.seo.socials)
        .filter(([, url]) => url)
        .map(([key, url]) => ({
          key,
          label: SOCIAL_LABELS[key] ?? key,
          url: url as string,
        }))
    : [];

  const footer = {
    copyright: settings.appearance.copyright,
    pages: footerPages,
    socials,
  };

  const oa = oauthFlags(settings);
  const auth = {
    google: oa.google,
    github: oa.github,
    turnstileSiteKey: settings.integrations.turnstile.enabled
      ? settings.integrations.turnstile.siteKey
      : "",
    tagline: settings.seo.siteDescription,
    authImage: settings.appearance.authImage,
  };

  return (
    <I18nProvider dict={dict} fallback={fallbackDict} locale={locale}>
      <ShellClient
        data={{
          subs,
          cats,
          footer,
          isLoggedIn: !!session,
          menuItems: settings.menu.items,
        }}
        chipsEnabled={settings.appearance.showChips}
        bellPollSec={settings.system.bellPollSec}
        logo={settings.appearance.logo}
        appName={settings.system.appName}
        auth={auth}
      >
        {children}
      </ShellClient>
    </I18nProvider>
  );
}
