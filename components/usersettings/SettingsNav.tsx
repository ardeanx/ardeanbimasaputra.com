"use client";

import { useT } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SettingsNav() {
  const t = useT();
  const pathname = usePathname();
  const items = [
    { href: "/settings/profile", label: t("usersettings.nav.profile") },
    { href: "/settings/account", label: t("usersettings.nav.account") },
    { href: "/settings/security", label: t("usersettings.nav.security") },
    { href: "/settings/notifications", label: t("usersettings.nav.notifications") },
    { href: "/settings/preferences", label: t("usersettings.nav.preferences") },
    { href: "/settings/billing", label: t("usersettings.nav.billing") },
  ];
  return (
    <nav
      aria-label={t("usersettings.nav.aria")}
      className="flex shrink-0 gap-1 overflow-x-auto md:sticky md:top-20 md:block md:w-56 md:space-y-0.5 md:self-start"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block whitespace-nowrap rounded-lg px-4 py-2 text-sm hover:bg-yt-hover ${
            pathname === item.href ? "bg-yt-hover font-medium text-yt-text" : "text-yt-text2"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
