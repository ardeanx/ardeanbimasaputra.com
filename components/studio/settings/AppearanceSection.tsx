"use client";

import { saveSettingsAction } from "@/app/(studio)/studio/settings/actions";
import { useT } from "@/components/i18n/I18nProvider";
import Select from "@/components/ui/Select";
import type { AppSettings } from "@/lib/settings";
import { Check } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import DropzoneField from "./DropzoneField";
import { Field, GroupTitle, Row, type SaveHandle, Toggle, inputCls } from "./forms";

type Appearance = AppSettings["appearance"];

const FONTS = [
  { value: "system", label: "System", family: "system-ui, sans-serif" },
  { value: "inter", label: "Inter", family: "Inter, sans-serif" },
  { value: "roboto", label: "Roboto", family: "Roboto, sans-serif" },
  { value: "merriweather", label: "Merriweather", family: "Merriweather, serif" },
  {
    value: "jetbrains-mono",
    label: "JetBrains Mono",
    family: "'JetBrains Mono', monospace",
  },
];

function Mock({ dark }: { dark?: boolean }) {
  const line = dark ? "bg-white/25" : "bg-black/15";
  const border = dark ? "border-white/10" : "border-black/10";
  const thumb = dark ? "bg-white/15" : "bg-black/10";
  const bg = dark ? "bg-[#0f0f0f]" : "bg-white";
  return (
    <div className={`h-full w-full ${bg}`}>
      <div className={`flex h-2.5 items-center gap-0.5 border-b px-1.5 ${border}`}>
        <span className="h-1 w-1 rounded-full bg-[#ff5f57]" />
        <span className="h-1 w-1 rounded-full bg-[#febc2e]" />
        <span className="h-1 w-1 rounded-full bg-[#28c840]" />
        <span className={`ml-1 h-0.5 flex-1 rounded ${line}`} />
      </div>
      <div className="flex h-[calc(100%-0.625rem)]">
        <div className={`w-1/4 space-y-1 border-r p-1.5 ${border}`}>
          <span className="block h-1 w-full rounded" style={{ background: "var(--yt-cta)" }} />
          <span className={`block h-0.5 w-3/4 rounded ${line}`} />
          <span className={`block h-0.5 w-full rounded ${line}`} />
          <span className={`block h-0.5 w-2/3 rounded ${line}`} />
        </div>
        <div className="flex-1 space-y-1 p-1.5">
          <div className={`h-1/2 w-full rounded ${thumb}`} />
          <span className={`block h-0.5 w-3/4 rounded ${line}`} />
          <span className={`block h-0.5 w-1/2 rounded ${line}`} />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  mode,
  label,
  active,
  onSelect,
}: {
  mode: Appearance["defaultTheme"];
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={t("settings.appearance.themeCard", { label })}
      onClick={onSelect}
      className={`rounded-xl border-2 p-1.5 text-center transition ${
        active ? "border-yt-cta" : "border-yt-outline hover:border-yt-text2"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-yt-outline">
        {mode === "light" && <Mock />}
        {mode === "dark" && <Mock dark />}
        {mode === "system" && (
          <>
            <div className="absolute inset-0">
              <Mock />
            </div>
            <div
              className="absolute inset-0"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            >
              <Mock dark />
            </div>
          </>
        )}
        {active && (
          <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-yt-cta text-white shadow">
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </div>
      <span
        className={`mt-1.5 block text-xs ${active ? "font-medium text-yt-cta" : "text-yt-text2"}`}
      >
        {label}
      </span>
    </button>
  );
}

const AppearanceSection = forwardRef<SaveHandle, { appearance: Appearance }>(
  function AppearanceSection({ appearance }, ref) {
    const t = useT();
    const [s, setS] = useState(appearance);

    function patch<K extends keyof Appearance>(k: K, v: Appearance[K]) {
      setS((p) => ({ ...p, [k]: v }));
    }

    async function save() {
      const validHex = /^#[0-9a-fA-F]{6}$/.test(s.primaryColor);
      if (!validHex) {
        toast.error(t("settings.appearance.invalidHex"));
      }
      const payload = validHex ? s : { ...s, primaryColor: appearance.primaryColor };
      const res = await saveSettingsAction({ appearance: payload });
      if ("error" in res) {
        toast.error(res.error);
        return false;
      }
      return true;
    }
    useImperativeHandle(ref, () => ({ save }));

    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
        <div className="grid grid-cols-2 gap-x-6">
          <DropzoneField
            label={t("settings.appearance.logo")}
            value={s.logo}
            onChange={(v) => patch("logo", v)}
            hint={t("settings.appearance.logoHint")}
            fit="contain"
          />
          <DropzoneField
            label={t("settings.appearance.favicon")}
            value={s.favicon}
            onChange={(v) => patch("favicon", v)}
            hint={t("settings.appearance.faviconHint")}
            fit="contain"
            skipCropFor={/^image\/(?:x-icon|vnd\.microsoft\.icon)$/}
          />
        </div>

        <DropzoneField
          label={t("settings.appearance.authImage")}
          value={s.authImage}
          onChange={(v) => patch("authImage", v)}
          hint={t("settings.appearance.authImageHint")}
          fit="cover"
          aspectRatio={3 / 4}
        />

        <Field label={t("settings.appearance.defaultTheme")}>
          <div
            role="radiogroup"
            aria-label={t("settings.appearance.defaultTheme")}
            className="grid max-w-md grid-cols-3 gap-3"
          >
            <ThemeCard
              mode="light"
              label={t("settings.appearance.themeLight")}
              active={s.defaultTheme === "light"}
              onSelect={() => patch("defaultTheme", "light")}
            />
            <ThemeCard
              mode="dark"
              label={t("settings.appearance.themeDark")}
              active={s.defaultTheme === "dark"}
              onSelect={() => patch("defaultTheme", "dark")}
            />
            <ThemeCard
              mode="system"
              label={t("settings.appearance.themeSystem")}
              active={s.defaultTheme === "system"}
              onSelect={() => patch("defaultTheme", "system")}
            />
          </div>
        </Field>

        <Field
          label={t("settings.appearance.primaryColor")}
          hint={t("settings.appearance.primaryColorHint")}
        >
          <div className="flex items-start gap-5">
            <HexColorPicker color={s.primaryColor} onChange={(c) => patch("primaryColor", c)} />
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-9 w-9 shrink-0 rounded-full border border-yt-outline"
                style={{ background: s.primaryColor }}
              />
              <input
                value={s.primaryColor}
                aria-label={t("settings.appearance.hexCode")}
                onChange={(e) => patch("primaryColor", e.target.value)}
                className={`${inputCls} w-28 font-mono`}
              />
            </div>
          </div>
        </Field>

        <Row label={t("settings.appearance.siteFont")}>
          <Select
            ariaLabel={t("settings.appearance.siteFont")}
            className="w-56"
            value={s.siteFont}
            onChange={(v) => patch("siteFont", v as Appearance["siteFont"])}
            options={FONTS.map((f) => ({
              value: f.value,
              label: f.label,
              icon: (
                <span
                  aria-hidden
                  style={{ fontFamily: f.family }}
                  className="w-6 shrink-0 text-center text-base leading-none"
                >
                  Ag
                </span>
              ),
            }))}
          />
        </Row>
        <Row
          label={t("settings.appearance.splashScreen")}
          hint={t("settings.appearance.splashScreenHint")}
        >
          <Toggle
            ariaLabel={t("settings.appearance.splashScreen")}
            checked={s.enableSplashScreen}
            onChange={(v) => patch("enableSplashScreen", v)}
          />
        </Row>
        <Row label={t("settings.appearance.chips")} hint={t("settings.appearance.chipsHint")}>
          <Toggle
            ariaLabel={t("settings.appearance.chips")}
            checked={s.showChips}
            onChange={(v) => patch("showChips", v)}
          />
        </Row>
        <GroupTitle>{t("settings.appearance.footer")}</GroupTitle>
        <Field
          label={t("settings.appearance.copyright")}
          hint={t("settings.appearance.copyrightHint")}
        >
          <input
            value={s.copyright}
            aria-label={t("settings.appearance.copyright")}
            maxLength={200}
            onChange={(e) => patch("copyright", e.target.value)}
            className={`${inputCls} max-w-md`}
          />
        </Field>
        <Row
          label={t("settings.appearance.footerPages")}
          hint={t("settings.appearance.footerPagesHint")}
        >
          <Toggle
            ariaLabel={t("settings.appearance.footerPages")}
            checked={s.footerShowPages}
            onChange={(v) => patch("footerShowPages", v)}
          />
        </Row>
        <Row
          label={t("settings.appearance.footerSocials")}
          hint={t("settings.appearance.footerSocialsHint")}
        >
          <Toggle
            ariaLabel={t("settings.appearance.footerSocials")}
            checked={s.footerShowSocials}
            onChange={(v) => patch("footerShowSocials", v)}
          />
        </Row>
        <GroupTitle>{t("settings.appearance.info")}</GroupTitle>
        <p className="pb-2 text-xs text-yt-text2">{t("settings.appearance.themeInfo")}</p>
      </div>
    );
  },
);

export default AppearanceSection;
