"use client";

import {
  AudioLines,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  FileText,
  Languages,
  LogOut,
  Package,
  ShoppingBag,
  SunMoon,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  listSearchHistoryAction,
  recordSearchAction,
  removeSearchAction,
  setLangAction,
} from "@/app/(shell)/search-actions";
import { openAuthModal } from "@/components/auth/authModalStore";
import { useT } from "@/components/i18n/I18nProvider";
import { authClient } from "@/lib/auth-client";
import {
  HistoryIcon,
  Logo,
  MenuIcon,
  MicIcon,
  PersonCircleIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "./icons";
import NotificationBell from "./NotificationBell";
import SearchCommand, { startVoiceSearch } from "./SearchCommand";

const LS_KEY = "search-history";

function lsList(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((q) => typeof q === "string") : [];
  } catch {
    return [];
  }
}

function lsSave(items: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 10)));
}

function readLangCookie(): string {
  const m = document.cookie.match(/(?:^|;\s*)lang=(\w+)/);
  return m?.[1] ?? "id";
}

export default function Header({
  onMenu,
  bellPollSec = 30,
  logo,
  appName,
}: {
  onMenu: () => void;
  bellPollSec?: number;
  logo?: string | null;
  appName?: string;
}) {
  const router = useRouter();
  const t = useT();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "theme" | "lang">("main");
  const [lang, setLangState] = useState("id");
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histOpen, setHistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!histOpen) return;
    function onDown(e: PointerEvent) {
      if (!searchRef.current?.contains(e.target as Node)) setHistOpen(false);
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [histOpen]);

  function loadHistory() {
    if (session) {
      listSearchHistoryAction()
        .then(setHistory)
        .catch(() => {});
    } else {
      setHistory(lsList());
    }
  }

  function openHistory() {
    loadHistory();
    setHistOpen(true);
  }

  function openSearch() {
    loadHistory();
    setSearchOpen(true);
  }

  function submitSearch(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setHistOpen(false);
    setQuery(text);
    if (session) void recordSearchAction(text).catch(() => {});
    else lsSave([text, ...lsList().filter((q) => q !== text)]);
    router.push(`/results?search_query=${encodeURIComponent(text)}`);
  }

  function removeHistory(q: string) {
    setHistory((cur) => cur.filter((h) => h !== q));
    if (session) void removeSearchAction(q).catch(() => {});
    else lsSave(lsList().filter((h) => h !== q));
  }

  function voiceSearch() {
    startVoiceSearch({
      onText: submitSearch,
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onUnsupported: () => {
        import("sonner").then(({ toast }) => toast.error(t("search.voiceUnsupported")));
      },
      onError: () => {
        setListening(false);
        import("sonner").then(({ toast }) => toast.error(t("search.voiceError")));
      },
    });
  }

  async function signOut() {
    await authClient.signOut();
    setMenuOpen(false);
    router.refresh();
  }

  function openMenu() {
    setMenuView("main");
    setLangState(readLangCookie());
    setMenuOpen(true);
  }

  async function chooseLang(code: string) {
    setLangState(code);
    setMenuOpen(false);
    await setLangAction(code);
    router.refresh();
  }

  const username = (session?.user as { username?: string } | undefined)?.username;
  const filtered = history
    .filter((h) => h.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 10);

  const row = "flex w-full items-center gap-4 px-4 py-2 text-left text-sm hover:bg-yt-hover";

  return (
    <header className="flex h-14 items-center justify-between pl-4 pr-2 sm:pr-4">
      <div className="flex shrink-0 items-center">
        <button
          onClick={onMenu}
          aria-label={t("aria.guide")}
          className="grid h-10 w-10 place-items-center rounded-full hover:bg-yt-hover"
        >
          <MenuIcon />
        </button>
        <Link href="/" className="ml-4" aria-label={t("aria.homeBrand")}>
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

      <div className="hidden min-w-0 flex-1 items-center justify-center px-4 sm:flex sm:px-8">
        <div ref={searchRef} className="relative h-10 w-full max-w-[540px]">
          <form
            action="/results"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch(query);
            }}
            className="flex h-10"
          >
            <div className="flex min-w-0 flex-1 items-center rounded-l-full border border-yt-searchborder bg-yt-base pl-4 focus-within:border-yt-cta">
              <input
                name="search_query"
                placeholder={t("search.placeholder")}
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={openHistory}
                className="w-full bg-transparent text-base outline-none placeholder:text-yt-text2"
              />
            </div>
            <button
              aria-label={t("search.button")}
              className="grid w-16 shrink-0 place-items-center rounded-r-full border border-l-0 border-yt-searchborder bg-yt-searchbtn hover:brightness-95"
            >
              <SearchIcon width={22} height={22} />
            </button>
          </form>

          {histOpen && filtered.length > 0 && (
            <div className="absolute inset-x-0 top-11 z-50 rounded-2xl bg-yt-menu py-3 shadow-[0_4px_32px_rgba(0,0,0,0.3)]">
              {filtered.map((h) => (
                <div
                  key={h}
                  role="button"
                  tabIndex={0}
                  onClick={() => submitSearch(h)}
                  onKeyDown={(e) => e.key === "Enter" && submitSearch(h)}
                  className="group flex cursor-pointer items-center gap-3 px-4 py-1.5 hover:bg-yt-hover"
                >
                  <HistoryIcon width={18} height={18} className="shrink-0 text-yt-text2" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{h}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHistory(h);
                    }}
                    className="hidden shrink-0 text-xs text-yt-cta hover:underline group-hover:block group-focus-within:block focus:block [@media(pointer:coarse)]:block"
                  >
                    {t("search.history.remove")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          aria-label={t("search.voice")}
          onClick={voiceSearch}
          className={`ml-3 hidden h-10 w-10 shrink-0 place-items-center rounded-full sm:grid ${
            listening ? "bg-red-600 text-white" : "bg-yt-chip hover:bg-yt-chip-hover"
          }`}
        >
          <MicIcon width={22} height={22} />
        </button>
      </div>

      {session ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label={t("search.button")}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-yt-hover sm:hidden"
          >
            <SearchIcon width={22} height={22} />
          </button>
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setCreateOpen((v) => !v)}
              aria-label={t("aria.createMenu")}
              aria-expanded={createOpen}
              className="flex h-9 items-center gap-1.5 rounded-full bg-yt-chip pl-3 pr-3.5 text-sm font-medium hover:bg-yt-chip-hover"
            >
              <PlusIcon width={20} height={20} /> {t("header.create")}
            </button>
            {createOpen && (
              <>
                <button
                  aria-label={t("aria.closeMenu")}
                  className="fixed inset-0 z-[90] cursor-default"
                  onClick={() => setCreateOpen(false)}
                />
                <div className="absolute right-0 top-11 z-[95] w-56 rounded-xl bg-yt-menu py-2 shadow-[0_4px_32px_rgba(0,0,0,0.25)]">
                  {(
                    [
                      ["POST", FileText, t("create.post")],
                      ["VIDEO", Video, t("create.video")],
                      ["RESOURCE", Package, t("create.resource")],
                      ["AUDIO", AudioLines, t("create.audio")],
                    ] as const
                  ).map(([type, Icon, label]) => (
                    <Link
                      key={type}
                      href={`/studio/new?type=${type}`}
                      onClick={() => setCreateOpen(false)}
                      className={row}
                    >
                      <Icon size={20} className="text-yt-text2" />
                      {label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <NotificationBell pollSec={bellPollSec} />
          <div className="ml-1">
            <button
              onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
              aria-label={t("aria.accountMenu")}
              className="block h-8 w-8 overflow-hidden rounded-full"
            >
              {session.user.image ? (
                <img src={session.user.image} alt="" className="h-8 w-8" />
              ) : (
                <span className="grid h-8 w-8 place-items-center bg-yt-cta text-sm font-medium text-yt-cta-text">
                  {session.user.name[0]?.toUpperCase()}
                </span>
              )}
            </button>

            {menuOpen &&
              createPortal(
                <>
                  <button
                    aria-label={t("aria.closeMenu")}
                    className="fixed inset-0 z-[90] cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="fixed right-2 top-12 z-[95] max-h-[calc(100vh-64px)] w-[300px] overflow-y-auto rounded-xl bg-yt-menu py-2 shadow-[0_4px_32px_rgba(0,0,0,0.25)]">
                    {menuView === "main" && (
                      <>
                        <div className="flex gap-4 px-4 pb-3 pt-1">
                          {session.user.image ? (
                            <img
                              src={session.user.image}
                              alt=""
                              className="h-10 w-10 rounded-full bg-yt-hover"
                            />
                          ) : (
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-yt-cta font-medium text-yt-cta-text">
                              {session.user.name[0]?.toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 text-sm">
                            <p className="truncate font-medium">{session.user.name}</p>
                            <p className="truncate text-yt-text2">@{username}</p>
                            <Link
                              href={`/@${username}`}
                              onClick={() => setMenuOpen(false)}
                              className="mt-1 block text-yt-cta"
                            >
                              {t("menu.viewProfile")}
                            </Link>
                          </div>
                        </div>

                        <div className="border-t border-yt-outline py-2">
                          <Link href="/studio" onClick={() => setMenuOpen(false)} className={row}>
                            <Clapperboard size={20} className="text-yt-text2" />
                            {t("menu.studio")}
                          </Link>
                          <Link href="/orders" onClick={() => setMenuOpen(false)} className={row}>
                            <ShoppingBag size={20} className="text-yt-text2" />
                            {t("menu.purchases")}
                          </Link>
                        </div>

                        <div className="border-t border-yt-outline py-2">
                          <button onClick={() => setMenuView("theme")} className={row}>
                            <SunMoon size={20} className="text-yt-text2" />
                            <span className="min-w-0 flex-1 truncate">
                              {t("menu.appearance")}:{" "}
                              {theme === "light"
                                ? t("theme.light")
                                : theme === "dark"
                                  ? t("theme.dark")
                                  : t("theme.system")}
                            </span>
                            <ChevronRight size={16} className="shrink-0 text-yt-text2" />
                          </button>
                          <button onClick={() => setMenuView("lang")} className={row}>
                            <Languages size={20} className="text-yt-text2" />
                            <span className="min-w-0 flex-1 truncate">
                              {t("menu.language")}: {lang === "en" ? "English" : "Bahasa Indonesia"}
                            </span>
                            <ChevronRight size={16} className="shrink-0 text-yt-text2" />
                          </button>
                          <Link href="/settings" onClick={() => setMenuOpen(false)} className={row}>
                            <SettingsIcon width={20} height={20} className="text-yt-text2" />
                            {t("menu.settings")}
                          </Link>
                        </div>

                        <div className="border-t border-yt-outline pt-2">
                          <button onClick={signOut} className={row}>
                            <LogOut size={20} className="text-yt-text2" />
                            {t("menu.signOut")}
                          </button>
                        </div>
                      </>
                    )}

                    {menuView === "theme" && (
                      <>
                        <button
                          onClick={() => setMenuView("main")}
                          className="flex w-full items-center gap-3 border-b border-yt-outline px-3 pb-3 pt-1 text-left text-base font-medium"
                        >
                          <ChevronLeft size={20} />
                          {t("menu.appearance")}
                        </button>
                        <div className="py-2">
                          {(
                            [
                              ["system", t("theme.system")],
                              ["light", t("theme.light")],
                              ["dark", t("theme.dark")],
                            ] as const
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() => {
                                setTheme(value);
                                setMenuOpen(false);
                              }}
                              className={row}
                            >
                              <span className="w-5">{theme === value && <Check size={16} />}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {menuView === "lang" && (
                      <>
                        <button
                          onClick={() => setMenuView("main")}
                          className="flex w-full items-center gap-3 border-b border-yt-outline px-3 pb-3 pt-1 text-left text-base font-medium"
                        >
                          <ChevronLeft size={20} />
                          {t("menu.language")}
                        </button>
                        <div className="py-2">
                          {(
                            [
                              ["id", "Bahasa Indonesia"],
                              ["en", "English"],
                            ] as const
                          ).map(([value, label]) => (
                            <button key={value} onClick={() => chooseLang(value)} className={row}>
                              <span className="w-5">{lang === value && <Check size={16} />}</span>
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>,
                document.body,
              )}
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label={t("search.button")}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-yt-hover sm:hidden"
          >
            <SearchIcon width={22} height={22} />
          </button>
          <button
            type="button"
            onClick={() => openAuthModal("signin")}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-yt-searchborder px-3 text-sm font-medium text-yt-cta hover:bg-yt-cta/10"
          >
            <PersonCircleIcon width={22} height={22} /> {t("header.signIn")}
          </button>
        </div>
      )}

      {searchOpen && (
        <SearchCommand
          onClose={() => setSearchOpen(false)}
          history={history}
          onSubmit={submitSearch}
          onRemove={removeHistory}
        />
      )}
    </header>
  );
}
