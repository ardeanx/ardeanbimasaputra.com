"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { openAuthModal } from "@/components/auth/authModalStore";
import BottomNav from "./BottomNav";
import Chips, { ChipRow } from "./Chips";
import { GuideContent, GuideDrawer, MiniGuide, type GuideData } from "./Guide";
import Header from "./Header";

type AuthFlags = {
  google: boolean;
  github: boolean;
  turnstileSiteKey: string;
  tagline: string;
  authImage: string | null;
};

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return localStorage.getItem("guide-collapsed") === "1";
}

function getServerSnapshot() {
  return false;
}

function setCollapsed(value: boolean) {
  localStorage.setItem("guide-collapsed", value ? "1" : "0");
  listeners.forEach((l) => l());
}

export default function ShellClient({
  data,
  children,
  logo,
  appName,
  auth,
  chipsEnabled = true,
  bellPollSec = 30,
}: {
  data: GuideData;
  children: React.ReactNode;
  logo?: string | null;
  appName?: string;
  auth: AuthFlags;
  chipsEnabled?: boolean;
  bellPollSec?: number;
}) {
  const pathname = usePathname();
  const showChips = chipsEnabled && pathname === "/";
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [drawer, setDrawer] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setDrawer(false);
    setHeaderHidden(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("signin")) return;
    openAuthModal("signin");
    params.delete("signin");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      setAtTop(y < 10);
      if (!document.querySelector("[data-smart-hide]")) {
        setHeaderHidden(false);
        lastY.current = y;
        return;
      }
      if (y > lastY.current && y > 80) setHeaderHidden(true);
      else if (y < lastY.current) setHeaderHidden(false);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  function onMenu() {
    const immersive =
      typeof document !== "undefined" && document.querySelector(".immersive-page") != null;
    if (immersive || !window.matchMedia("(min-width: 1312px)").matches) {
      setDrawer(true);
      return;
    }
    setCollapsed(!collapsed);
  }

  const sidebarPad = collapsed ? "mini:pl-[72px]" : "mini:pl-[72px] guide:pl-60";

  return (
    <>
      <div
        className={`app-topbar fixed inset-x-0 top-0 z-30 bg-yt-header backdrop-blur-[12px] transition-transform duration-200 ${
          headerHidden ? "-translate-y-full" : ""
        } ${atTop ? "" : "topbar-scrolled"}`}
      >
        <Header onMenu={onMenu} bellPollSec={bellPollSec} logo={logo} appName={appName} />
        {showChips && (
          <div className={sidebarPad}>
            <Suspense fallback={<ChipRow cats={data.cats} active={null} />}>
              <Chips cats={data.cats} />
            </Suspense>
          </div>
        )}
      </div>

      <aside
        className={`app-guide guide-scroll fixed bottom-0 top-14 z-40 hidden w-60 overflow-y-auto bg-yt-base ${
          collapsed ? "" : "guide:block"
        }`}
      >
        <GuideContent data={data} />
      </aside>
      <aside
        className={`app-miniguide fixed bottom-0 top-14 z-40 hidden w-[72px] bg-yt-base ${
          collapsed ? "mini:block" : "mini:block guide:hidden"
        }`}
      >
        <MiniGuide data={data} />
      </aside>

      {drawer && (
        <GuideDrawer data={data} logo={logo} appName={appName} onClose={() => setDrawer(false)} />
      )}

      <main className={`app-main ${showChips ? "pt-28" : "pt-14"} ${sidebarPad} pb-14 mini:pb-0`}>
        {children}
      </main>

      <BottomNav />

      <AuthModal
        googleEnabled={auth.google}
        githubEnabled={auth.github}
        turnstileSiteKey={auth.turnstileSiteKey}
        appName={appName ?? "Ardean"}
        tagline={auth.tagline}
        authImage={auth.authImage}
      />
    </>
  );
}
