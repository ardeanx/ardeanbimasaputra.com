"use client";

import { ExternalLink, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { HomeIcon, MenuIcon, PlusIcon, SearchIcon } from "@/components/shell/icons";
import { useT } from "@/components/i18n/I18nProvider";
import NotificationBell from "@/components/shell/NotificationBell";
import { authClient } from "@/lib/auth-client";

export default function StudioTopbar({
  image,
  logo,
  appName,
  onMenu,
}: {
  image: string | null;
  logo: string | null;
  appName: string;
  onMenu: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);

  const user = session?.user as
    { name?: string; username?: string; role?: string | null } | undefined;
  const isAdmin = user?.role === "admin";

  async function signOut() {
    await authClient.signOut();
    setOpen(false);
    router.refresh();
  }

  const row = "flex w-full items-center gap-4 px-4 py-2 text-left text-sm hover:bg-yt-hover";

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 bg-yt-base px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label={t("common.menu")}
          className="grid h-10 w-10 place-items-center rounded-full text-yt-text hover:bg-yt-hover"
        >
          <MenuIcon width={22} height={22} />
        </button>
        <Link
          href="/studio"
          aria-label={t("studio.nav.dashboard")}
          className="flex items-center gap-1.5"
        >
          {logo ? (
            <img src={logo} alt={appName} className="h-6 w-auto object-contain" />
          ) : (
            <svg viewBox="0 0 28 20" width={26} height={19} aria-hidden>
              <rect width="28" height="20" rx="4.5" fill="#065fd4" />
              <path d="M11.5 5.5v9L19 10l-7.5-4.5Z" fill="#fff" />
            </svg>
          )}
          <span className="text-[17px] font-medium leading-none tracking-[-0.04em]">Studio</span>
        </Link>
      </div>

      <form
        action="/studio/content"
        className="mx-auto hidden h-10 w-full max-w-[560px] items-center gap-2 rounded-full border border-yt-outline bg-yt-base px-4 focus-within:border-yt-cta md:flex"
      >
        <SearchIcon width={18} height={18} className="text-yt-text2" />
        <input
          name="q"
          placeholder={t("studio.topbar.searchPlaceholder")}
          className="h-full w-full bg-transparent text-sm text-yt-text outline-none placeholder:text-yt-text2"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <Link
          href="/"
          aria-label={t("studio.topbar.backToSite")}
          title={t("studio.topbar.backToSite")}
          className="grid h-10 w-10 place-items-center rounded-full text-yt-text hover:bg-yt-hover"
        >
          <HomeIcon width={22} height={22} />
        </Link>
        <NotificationBell />
        <Link
          href="/studio/new"
          className="ml-1 flex h-9 items-center gap-1.5 rounded-full bg-yt-cta pl-3 pr-4 text-sm font-medium text-yt-cta-text"
        >
          <PlusIcon width={18} height={18} /> {t("studio.topbar.create")}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t("studio.topbar.accountMenu")}
          className="ml-1 block h-8 w-8 overflow-hidden rounded-full bg-yt-hover"
        >
          {image ? (
            <img src={image} alt="" className="h-8 w-8 object-cover" />
          ) : (
            <span className="grid h-8 w-8 place-items-center bg-yt-cta text-sm font-medium text-yt-cta-text">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </button>

        {open &&
          createPortal(
            <>
              <button
                aria-label={t("common.closeMenu")}
                className="fixed inset-0 z-[90] cursor-default"
                onClick={() => setOpen(false)}
              />
              <div className="fixed right-2 top-12 z-[95] w-[280px] overflow-hidden rounded-xl bg-yt-menu py-2 shadow-[0_4px_32px_rgba(0,0,0,0.25)]">
                <div className="flex gap-3 px-4 pb-3 pt-1">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="h-10 w-10 rounded-full bg-yt-hover object-cover"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-cta font-medium text-yt-cta-text">
                      {user?.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{user?.name}</p>
                    {user?.username && <p className="truncate text-yt-text2">@{user.username}</p>}
                  </div>
                </div>

                <div className="border-t border-yt-outline py-2">
                  <Link href="/" onClick={() => setOpen(false)} className={row}>
                    <ExternalLink size={20} className="text-yt-text2" />
                    {t("studio.topbar.viewSite")}
                  </Link>
                  {isAdmin && (
                    <Link href="/studio/settings" onClick={() => setOpen(false)} className={row}>
                      <Settings size={20} className="text-yt-text2" />
                      {t("studio.topbar.siteSettings")}
                    </Link>
                  )}
                  <Link href="/settings/profile" onClick={() => setOpen(false)} className={row}>
                    <UserRound size={20} className="text-yt-text2" />
                    {t("studio.topbar.myProfile")}
                  </Link>
                </div>

                <div className="border-t border-yt-outline pt-2">
                  <button type="button" onClick={signOut} className={row}>
                    <LogOut size={20} className="text-yt-text2" />
                    {t("menu.signOut")}
                  </button>
                </div>
              </div>
            </>,
            document.body,
          )}
      </div>
    </header>
  );
}
