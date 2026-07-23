"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { HomeIcon, PersonIcon, PlusIcon, StoreIcon, SubscriptionsIcon } from "./icons";

const ITEMS = [
  { href: "/", icon: HomeIcon, key: "nav.home" },
  { href: "/store", icon: StoreIcon, key: "nav.store" },
  { href: "/studio", icon: PlusIcon, key: "header.create", center: true },
  { href: "/feed/subscriptions", icon: SubscriptionsIcon, key: "nav.following" },
  { href: "/feed/history", icon: PersonIcon, key: "nav.you" },
];

export default function BottomNav() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav className="app-bottomnav fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch border-t border-yt-outline bg-yt-base mini:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px]"
          >
            {item.center ? (
              <span className="grid h-7 w-11 place-items-center rounded-full bg-yt-chip">
                <Icon width={22} height={22} />
              </span>
            ) : (
              <Icon width={22} height={22} className={active ? "" : "text-yt-text2"} />
            )}
            <span className={active ? "font-medium" : "text-yt-text2"}>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
