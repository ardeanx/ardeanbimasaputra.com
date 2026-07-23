"use client";

import {
  FileText,
  Image as ImageIcon,
  Languages as LanguagesIcon,
  Users as UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import {
  CommunityIcon,
  ContentIcon,
  DashboardIcon,
  EarnIcon,
  FeedbackIcon,
  SettingsIcon,
} from "@/components/shell/icons";

type Item = {
  href: string;
  labelKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  soon?: string;
  adminOnly?: boolean;
};

const MAIN: Item[] = [
  { href: "/studio", labelKey: "studio.nav.dashboard", icon: DashboardIcon },
  { href: "/studio/content", labelKey: "studio.nav.content", icon: ContentIcon },
  { href: "/studio/media", labelKey: "studio.nav.media", icon: ImageIcon },
  {
    href: "/studio/moderation",
    labelKey: "studio.nav.moderation",
    icon: CommunityIcon,
    adminOnly: true,
  },
  { href: "/studio/users", labelKey: "studio.nav.users", icon: UsersIcon, adminOnly: true },
  { href: "/studio/produk", labelKey: "studio.nav.products", icon: EarnIcon, adminOnly: true },
  {
    href: "/studio/comments",
    labelKey: "studio.nav.comments",
    icon: FeedbackIcon,
    adminOnly: true,
  },
  { href: "/studio/pages", labelKey: "studio.nav.pages", icon: FileText, adminOnly: true },
  {
    href: "/studio/languages",
    labelKey: "studio.nav.languages",
    icon: LanguagesIcon,
    adminOnly: true,
  },
];

const BOTTOM: Item[] = [
  {
    href: "/studio/settings",
    labelKey: "studio.nav.settings",
    icon: SettingsIcon,
    adminOnly: true,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/studio") return pathname === "/studio";
  return pathname === href || pathname.startsWith(href + "/");
}

function Row({ item, active, onClick }: { item: Item; active: boolean; onClick: () => void }) {
  const t = useT();
  const Icon = item.icon;
  const inner = (
    <>
      <Icon width={22} height={22} className={active ? "text-yt-cta" : ""} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {item.soon && <span className="text-[10px] text-yt-text2">{item.soon}</span>}
    </>
  );
  const base = "relative flex items-center gap-4 rounded-lg px-4 py-2.5 text-sm font-medium";
  if (item.soon) {
    return <span className={`${base} cursor-default text-yt-text2/60`}>{inner}</span>;
  }
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`${base} hover:bg-yt-hover ${
        active ? "bg-yt-hover font-semibold" : "text-yt-text"
      }`}
    >
      {inner}
    </Link>
  );
}

export default function StudioNav({
  isAdmin,
  name,
  username,
  image,
  open,
  collapsed,
  onClose,
}: {
  isAdmin: boolean;
  name: string;
  username: string | null;
  image: string | null;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const pathname = usePathname();
  const main = MAIN.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t("common.closeMenu")}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto bg-yt-base p-3 transition-transform md:sticky md:z-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:hidden" : "md:translate-x-0"}`}
      >
        <div className="flex flex-col items-center gap-1 px-2 py-4">
          <img
            src={image ?? ""}
            alt=""
            className="h-20 w-20 rounded-full bg-yt-hover object-cover"
          />
          <span className="mt-2 text-xs text-yt-text2">{t("studio.nav.yourProfile")}</span>
          <span className="text-sm font-medium">{name}</span>
          {username && <span className="text-xs text-yt-text2">@{username}</span>}
        </div>

        <nav className="mt-2 space-y-0.5">
          {main.map((item) => (
            <Row
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              onClick={onClose}
            />
          ))}
        </nav>

        <div className="my-3" />

        <nav className="space-y-0.5">
          {BOTTOM.filter((i) => !i.adminOnly || isAdmin).map((item) => (
            <Row
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              onClick={onClose}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
