"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/settings/profile", label: "Profil" },
  { href: "/settings/account", label: "Akun" },
  { href: "/settings/security", label: "Keamanan" },
  { href: "/settings/notifications", label: "Notifikasi" },
  { href: "/settings/preferences", label: "Preferensi" },
  { href: "/settings/billing", label: "Pembelian" },
];

export default function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Kategori setelan"
      className="flex shrink-0 gap-1 overflow-x-auto md:sticky md:top-20 md:block md:w-56 md:space-y-0.5 md:self-start"
    >
      {ITEMS.map((item) => (
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
