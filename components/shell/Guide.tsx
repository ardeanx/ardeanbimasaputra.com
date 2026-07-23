"use client";

import { ChevronDown, ChevronUp, icons } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import type { AppSettings } from "@/lib/settings";
import {
  BookmarkIcon,
  CompassIcon,
  ContentIcon,
  HistoryIcon,
  HomeIcon,
  Logo,
  MenuIcon,
  PersonIcon,
  StoreIcon,
  ThumbUpIcon,
} from "./icons";
import { SOCIAL_ICONS } from "./SocialIcons";

type MenuItem = AppSettings["menu"]["items"][number];

export type GuideData = {
  subs: { name: string; username: string | null; image: string | null }[];
  cats: { name: string; slug: string }[];
  isLoggedIn: boolean;
  menuItems: MenuItem[];
  footer: {
    copyright: string;
    pages: { slug: string; title: string }[];
    socials: { key: string; label: string; url: string }[];
  };
};

function MenuItemIcon({ item }: { item: MenuItem }) {
  if (item.iconType === "image") {
    return item.icon ? (
      <img src={item.icon} alt="" className="h-6 w-6 shrink-0 object-contain" />
    ) : (
      <span className="h-6 w-6 shrink-0" />
    );
  }
  const Icon = icons[item.icon as keyof typeof icons];
  return Icon ? <Icon size={24} /> : <span className="h-6 w-6 shrink-0" />;
}

function MenuItemLink({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const active = pathname === item.url;
  return (
    <Link
      href={item.url}
      target={item.newTab ? "_blank" : undefined}
      rel={item.newTab ? "noopener noreferrer" : undefined}
      className={`flex h-10 items-center gap-6 rounded-[10px] px-3 text-sm hover:bg-yt-hover ${
        active ? "bg-yt-hover font-medium" : ""
      }`}
    >
      <span className="shrink-0">
        <MenuItemIcon item={item} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function ExploreSection({ items }: { items: MenuItem[] }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, 3);
  return (
    <Section title={t("nav.explore")}>
      {visible.map((item) => (
        <MenuItemLink key={item.id} item={item} />
      ))}
      {items.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-10 w-full items-center gap-6 rounded-[10px] px-3 text-sm hover:bg-yt-hover"
        >
          <span className="shrink-0">
            {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </span>
          <span className="truncate">{t(expanded ? "nav.showLess" : "nav.showMore")}</span>
        </button>
      )}
    </Section>
  );
}

function GuideFooter({ footer }: { footer: GuideData["footer"] }) {
  const hasLinks = footer.pages.length > 0;
  const hasSocials = footer.socials.length > 0;
  if (!hasLinks && !hasSocials && !footer.copyright) return null;
  return (
    <div className="px-6 py-4 text-xs text-yt-text2">
      {hasLinks && (
        <nav className="flex flex-wrap gap-x-3 gap-y-1.5">
          {footer.pages.map((p) => (
            <Link key={p.slug} href={`/${p.slug}`} className="hover:text-yt-text">
              {p.title}
            </Link>
          ))}
        </nav>
      )}
      {hasSocials && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {footer.socials.map((s) => {
            const Icon = SOCIAL_ICONS[s.key];
            if (!Icon) return null;
            return (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="hover:text-yt-text"
              >
                {Icon({ size: 18 })}
              </a>
            );
          })}
        </div>
      )}
      {footer.copyright && <p className="mt-3">{footer.copyright}</p>}
    </div>
  );
}

function Item({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex h-10 items-center gap-6 rounded-[10px] px-3 text-sm hover:bg-yt-hover ${
        active ? "bg-yt-hover font-medium" : ""
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Section({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="border-b border-yt-outline px-3 py-3">
      {title && <h3 className="px-3 pb-1.5 pt-1 text-base font-medium">{title}</h3>}
      {children}
    </div>
  );
}

export function GuideContent({ data }: { data: GuideData }) {
  const t = useT();
  const topItems = data.menuItems.filter((i) => i.section === "top");
  const exploreItems = data.menuItems.filter((i) => i.section === "explore");
  const bottomItems = data.menuItems.filter((i) => i.section === "bottom");
  return (
    <nav className="pb-6">
      <Section>
        {topItems.map((item) => (
          <MenuItemLink key={item.id} item={item} />
        ))}
      </Section>

      {data.isLoggedIn ? (
        <Section title={t("nav.you")}>
          <Item href="/feed/history" icon={<HistoryIcon />} label={t("nav.history")} />
          <Item href="/feed/playlist" icon={<BookmarkIcon />} label={t("nav.saved")} />
          <Item href="/feed/liked" icon={<ThumbUpIcon />} label={t("nav.liked")} />
        </Section>
      ) : (
        <Section>
          <p className="px-3 py-1 text-sm text-yt-text2">{t("guide.signInPrompt")}</p>
          <button
            type="button"
            onClick={() => openAuthModal("signin")}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-full border border-yt-searchborder px-4 text-sm font-medium text-yt-cta hover:bg-yt-hover"
          >
            <PersonIcon />
            {t("header.signIn")}
          </button>
        </Section>
      )}

      <ExploreSection items={exploreItems} />

      {bottomItems.length > 0 && (
        <Section>
          {bottomItems.map((item) => (
            <MenuItemLink key={item.id} item={item} />
          ))}
        </Section>
      )}

      {data.isLoggedIn && data.subs.length > 0 && (
        <Section title={t("nav.channels")}>
          {data.subs.map((s) => (
            <Link
              key={s.username}
              href={`/@${s.username}`}
              className="flex h-10 items-center gap-6 rounded-[10px] px-3 text-sm hover:bg-yt-hover"
            >
              <img
                src={s.image ?? ""}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full bg-yt-hover"
              />
              <span className="truncate">{s.name}</span>
            </Link>
          ))}
        </Section>
      )}

      <GuideFooter footer={data.footer} />
    </nav>
  );
}

function MiniLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ width?: number; height?: number }>;
  label: string;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1.5 rounded-lg py-3.5 text-[10px] hover:bg-yt-hover ${
        pathname === href ? "font-medium" : ""
      }`}
    >
      <Icon />
      {label}
    </Link>
  );
}

function MiniFlyout({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ width?: number; height?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex w-full flex-col items-center gap-1.5 rounded-lg py-3.5 text-[10px] hover:bg-yt-hover"
      >
        <Icon />
        {label}
      </button>
      <div className="pointer-events-none invisible absolute left-full top-0 z-50 ml-1 w-60 rounded-xl bg-yt-menu p-2 opacity-0 shadow-[0_4px_32px_rgba(0,0,0,0.3)] transition-opacity group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
        <h3 className="px-3 pb-1 pt-1.5 text-sm font-medium">{label}</h3>
        {children}
      </div>
    </div>
  );
}

export function MiniGuide({ data }: { data: GuideData }) {
  const t = useT();
  const exploreItems = data.menuItems.filter((i) => i.section === "explore");
  return (
    <nav className="flex flex-col px-1 pt-1">
      <MiniLink href="/" icon={HomeIcon} label={t("nav.home")} />
      <MiniLink href="/store" icon={StoreIcon} label={t("nav.store")} />
      <MiniLink href="/resources" icon={ContentIcon} label={t("nav.resources")} />
      {exploreItems.length > 0 && (
        <MiniFlyout icon={CompassIcon} label={t("nav.explore")}>
          {exploreItems.map((item) => (
            <MenuItemLink key={item.id} item={item} />
          ))}
        </MiniFlyout>
      )}
      {data.isLoggedIn && (
        <MiniFlyout icon={PersonIcon} label={t("nav.you")}>
          <Item href="/feed/history" icon={<HistoryIcon />} label={t("nav.history")} />
          <Item href="/feed/playlist" icon={<BookmarkIcon />} label={t("nav.saved")} />
          <Item href="/feed/liked" icon={<ThumbUpIcon />} label={t("nav.liked")} />
        </MiniFlyout>
      )}
    </nav>
  );
}

export function GuideDrawer({
  data,
  logo,
  appName,
  onClose,
}: {
  data: GuideData;
  logo?: string | null;
  appName?: string;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label={t("aria.closeGuide")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <aside className="guide-scroll absolute bottom-0 left-0 top-0 w-60 overflow-y-auto bg-yt-base">
        <div className="sticky top-0 flex h-14 items-center bg-yt-base px-4">
          <button
            onClick={onClose}
            aria-label={t("aria.closeGuide")}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-yt-hover"
          >
            <MenuIcon />
          </button>
          <Link href="/" className="ml-4" onClick={onClose}>
            {logo ? (
              <img
                src={logo}
                alt={appName ?? t("aria.logoAlt")}
                className="h-6 w-auto object-contain"
              />
            ) : (
              <Logo />
            )}
          </Link>
        </div>
        <GuideContent data={data} />
      </aside>
    </div>
  );
}
