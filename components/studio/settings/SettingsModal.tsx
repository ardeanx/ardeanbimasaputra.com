"use client";

import { Globe, ListTree, Palette, Plug, Settings, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/components/i18n/I18nProvider";
import type { AppSettings } from "@/lib/settings";
import AppearanceSection from "./AppearanceSection";
import type { SaveHandle } from "./forms";
import IntegrationsSection from "./IntegrationsSection";
import MenuSection from "./MenuSection";
import SecuritySection, { type SessionRow } from "./SecuritySection";
import SeoSection from "./SeoSection";
import SystemSection from "./SystemSection";

const CATS = [
  { id: "system", labelKey: "settings.system.title", icon: Settings },
  { id: "appearance", labelKey: "settings.appearance.title", icon: Palette },
  { id: "menu", labelKey: "settings.menu.title", icon: ListTree },
  { id: "seo", labelKey: "settings.seo.title", icon: Globe },
  { id: "integrations", labelKey: "settings.integrations.title", icon: Plug },
  { id: "security", labelKey: "settings.security.title", icon: Shield },
] as const;

type CatId = (typeof CATS)[number]["id"];

const SAVABLE: CatId[] = ["system", "appearance", "menu", "seo", "security"];

export default function SettingsModal({
  settings,
  locales,
  sessions,
}: {
  settings: AppSettings;
  locales: string[];
  sessions: SessionRow[];
}) {
  const router = useRouter();
  const t = useT();
  const [active, setActive] = useState<CatId>("system");
  const [shown, setShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const handles = useRef<Partial<Record<CatId, SaveHandle | null>>>({});

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  function close() {
    router.push("/studio");
  }

  async function save() {
    const hs = Object.values(handles.current).filter((h): h is SaveHandle => !!h);
    if (hs.length === 0) return;
    setSaving(true);
    try {
      const results = await Promise.all(hs.map((h) => h.save()));
      if (results.every(Boolean)) toast.success(t("settings.saveSuccess"));
    } finally {
      setSaving(false);
    }
  }

  const setSystem = useCallback((h: SaveHandle | null) => {
    handles.current.system = h;
  }, []);
  const setAppearance = useCallback((h: SaveHandle | null) => {
    handles.current.appearance = h;
  }, []);
  const setMenu = useCallback((h: SaveHandle | null) => {
    handles.current.menu = h;
  }, []);
  const setSeo = useCallback((h: SaveHandle | null) => {
    handles.current.seo = h;
  }, []);
  const setSecurity = useCallback((h: SaveHandle | null) => {
    handles.current.security = h;
  }, []);

  const pane = (id: CatId) => (active === id ? "flex h-full min-h-0 flex-col" : "hidden");

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("settings.title")}
        className={`relative flex h-[85vh] max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-yt-raised shadow-[0_16px_70px_rgba(0,0,0,0.5)] transition-all duration-200 ${
          shown ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center border-b border-yt-outline px-6 py-4">
          <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
        </div>

        <div className="flex min-h-0 flex-1">
          <nav className="w-52 shrink-0 overflow-y-auto border-r border-yt-outline py-2">
            {CATS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors ${
                  active === c.id
                    ? "bg-yt-active font-medium"
                    : "text-yt-text2 hover:bg-yt-hover hover:text-yt-text"
                }`}
              >
                <c.icon size={18} className="shrink-0" />
                {t(c.labelKey)}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1">
            <div className={pane("system")}>
              <SystemSection ref={setSystem} system={settings.system} locales={locales} />
            </div>
            <div className={pane("appearance")}>
              <AppearanceSection ref={setAppearance} appearance={settings.appearance} />
            </div>
            <div className={pane("menu")}>
              <MenuSection ref={setMenu} menu={settings.menu} />
            </div>
            <div className={pane("seo")}>
              <SeoSection ref={setSeo} seo={settings.seo} />
            </div>
            <div className={pane("integrations")}>
              <IntegrationsSection integrations={settings.integrations} />
            </div>
            <div className={pane("security")}>
              <SecuritySection ref={setSecurity} security={settings.security} sessions={sessions} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-yt-outline px-6 py-3.5">
          <button
            type="button"
            onClick={close}
            className="h-9 rounded-full border border-yt-outline px-5 text-sm font-medium transition hover:bg-yt-hover"
          >
            {t("common.close")}
          </button>
          {SAVABLE.includes(active) && (
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="h-9 rounded-full bg-yt-cta px-6 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("settings.save")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
