"use client";

import { Check, ChevronDown } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/(studio)/studio/settings/actions";
import { useT } from "@/components/i18n/I18nProvider";
import type { AppSettings } from "@/lib/settings";
import Select from "@/components/ui/Select";
import { Field, GroupTitle, NumberField, Row, type SaveHandle, TextField, Toggle } from "./forms";

type SystemSettings = AppSettings["system"];

function dateSample(f: SystemSettings["dateFormat"]): string {
  const n = new Date();
  const dd = String(n.getDate()).padStart(2, "0");
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const y = String(n.getFullYear());
  if (f === "dd/MM/yyyy") return `${dd}/${mm}/${y}`;
  if (f === "MM/dd/yyyy") return `${mm}/${dd}/${y}`;
  if (f === "yyyy-MM-dd") return `${y}-${mm}-${dd}`;
  return n.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeSample(f: SystemSettings["timeFormat"]): string {
  const n = new Date();
  if (f === "HH:mm")
    return n.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return n.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const zones = useMemo(() => {
    const all = Intl.supportedValuesOf("timeZone").filter((z) =>
      /^(Asia|America|Europe)\//.test(z),
    );
    return ["UTC", ...all];
  }, []);
  const filtered = q ? zones.filter((z) => z.toLowerCase().includes(q.toLowerCase())) : zones;

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    }
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  function openMenu() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const up = window.innerHeight - r.bottom < 320 && r.top > 320;
    setPos({
      left: r.left,
      top: up ? r.top - 324 : r.bottom + 4,
      width: r.width,
    });
    setQ("");
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={t("settings.system.timezone")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-yt-outline bg-transparent px-3 text-left text-sm hover:bg-yt-hover"
      >
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-yt-text2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{ left: pos.left, top: pos.top, width: pos.width }}
            className="fixed z-[130] flex h-80 flex-col overflow-hidden rounded-xl bg-yt-menu shadow-[0_4px_32px_rgba(0,0,0,0.3)]"
          >
            <div className="shrink-0 p-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("settings.system.searchTimezone")}
                className="h-9 w-full rounded-lg border border-yt-outline bg-transparent px-3 text-sm outline-none focus:border-yt-cta"
              />
            </div>
            <div
              role="listbox"
              aria-label={t("settings.system.timezone")}
              className="flex-1 overflow-y-auto pb-1.5"
            >
              {filtered.map((z) => (
                <button
                  key={z}
                  type="button"
                  role="option"
                  aria-selected={z === value}
                  onClick={() => {
                    onChange(z);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-yt-hover"
                >
                  <span className="min-w-0 flex-1 truncate">{z}</span>
                  {z === value && <Check size={16} className="shrink-0 text-yt-cta" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-sm text-yt-text2">{t("common.noResults")}</p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

const SystemSection = forwardRef<SaveHandle, { system: SystemSettings; locales: string[] }>(
  function SystemSection({ system, locales }, ref) {
    const t = useT();
    const [s, setS] = useState(system);

    function patch<K extends keyof SystemSettings>(k: K, v: SystemSettings[K]) {
      setS((p) => ({ ...p, [k]: v }));
    }

    async function save() {
      const res = await saveSettingsAction({ system: s });
      if ("error" in res) {
        toast.error(res.error);
        return false;
      }
      return true;
    }
    useImperativeHandle(ref, () => ({ save }));

    const langNames = useMemo(() => {
      try {
        return new Intl.DisplayNames(["id"], { type: "language" });
      } catch {
        return null;
      }
    }, []);

    return (
      <>
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
          <div className="grid grid-cols-2 gap-x-6">
            <Field label={t("settings.system.appName")}>
              <TextField
                value={s.appName}
                onChange={(v) => patch("appName", v)}
                placeholder="Ardean"
              />
            </Field>
            <Field label={t("settings.system.adminEmail")}>
              <TextField
                value={s.adminEmail}
                onChange={(v) => patch("adminEmail", v)}
                placeholder="admin@situsanda.com"
              />
            </Field>
            <Field label={t("settings.system.timezone")}>
              <TimezoneSelect value={s.timezone} onChange={(v) => patch("timezone", v)} />
            </Field>
            <Field label={t("settings.system.defaultLanguage")}>
              <Select
                ariaLabel={t("settings.system.defaultLanguage")}
                value={s.defaultLanguage}
                onChange={(v) => patch("defaultLanguage", v)}
                options={locales.map((l) => ({
                  value: l,
                  label: langNames?.of(l) ?? l,
                  hint: l,
                }))}
              />
            </Field>
            <Field label={t("settings.system.dateFormat")}>
              <Select
                ariaLabel={t("settings.system.dateFormat")}
                value={s.dateFormat}
                onChange={(v) => patch("dateFormat", v as SystemSettings["dateFormat"])}
                options={(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "d MMMM yyyy"] as const).map(
                  (f) => ({ value: f, label: f, hint: dateSample(f) }),
                )}
              />
            </Field>
            <Field label={t("settings.system.timeFormat")}>
              <Select
                ariaLabel={t("settings.system.timeFormat")}
                value={s.timeFormat}
                onChange={(v) => patch("timeFormat", v as SystemSettings["timeFormat"])}
                options={(["HH:mm", "hh:mm a"] as const).map((f) => ({
                  value: f,
                  label: f === "HH:mm" ? t("settings.system.hour24") : t("settings.system.hour12"),
                  hint: timeSample(f),
                }))}
              />
            </Field>
          </div>

          <Row label={t("settings.system.defaultFormat")}>
            <Select
              ariaLabel={t("settings.system.defaultFormat")}
              className="w-44"
              value={s.defaultPostFormat}
              onChange={(v) => patch("defaultPostFormat", v as SystemSettings["defaultPostFormat"])}
              options={[
                { value: "POST", label: "Post" },
                { value: "VIDEO", label: "Video" },
                { value: "AUDIO", label: "Audio" },
                { value: "RESOURCE", label: "Resource" },
              ]}
            />
          </Row>
          <Row
            label={t("settings.system.autoOptimizeImage")}
            hint={t("settings.system.autoOptimizeImageHint")}
          >
            <Toggle
              ariaLabel={t("settings.system.autoOptimizeImage")}
              checked={s.autoOptimizeImage}
              onChange={(v) => patch("autoOptimizeImage", v)}
            />
          </Row>
          <Row label={t("settings.system.caching")} hint={t("settings.system.cachingHint")}>
            <Toggle
              ariaLabel={t("settings.system.caching")}
              checked={s.enableCaching}
              onChange={(v) => patch("enableCaching", v)}
            />
          </Row>
          <Row
            label={t("settings.system.autoDetectLanguage")}
            hint={t("settings.system.autoDetectLanguageHint")}
          >
            <Toggle
              ariaLabel={t("settings.system.autoDetectLanguage")}
              checked={s.autoDetectLanguage}
              onChange={(v) => patch("autoDetectLanguage", v)}
            />
          </Row>
          <Row
            label={t("settings.system.allowRegistration")}
            hint={t("settings.system.allowRegistrationHint")}
          >
            <Toggle
              ariaLabel={t("settings.system.allowRegistration")}
              checked={s.allowRegistration}
              onChange={(v) => patch("allowRegistration", v)}
            />
          </Row>

          <GroupTitle>{t("settings.system.advanced")}</GroupTitle>
          <Row label={t("settings.system.maintenance")} hint={t("settings.system.maintenanceHint")}>
            <Toggle
              ariaLabel={t("settings.system.maintenance")}
              checked={s.maintenance}
              onChange={(v) => patch("maintenance", v)}
            />
          </Row>
          <Row
            label={t("settings.system.requireReview")}
            hint={t("settings.system.requireReviewHint")}
          >
            <Toggle
              ariaLabel={t("settings.system.requireReview")}
              checked={s.requireReview}
              onChange={(v) => patch("requireReview", v)}
            />
          </Row>
          <Row label={t("settings.system.maxUpload")}>
            <NumberField
              ariaLabel={t("settings.system.maxUpload")}
              value={s.maxUploadMb}
              min={1}
              max={500}
              onChange={(v) => patch("maxUploadMb", v)}
            />
          </Row>
          <Row label={t("settings.system.allowVideoUpload")}>
            <Toggle
              ariaLabel={t("settings.system.allowVideoUpload")}
              checked={s.allowVideoUpload}
              onChange={(v) => patch("allowVideoUpload", v)}
            />
          </Row>

          <GroupTitle>{t("settings.system.notifications")}</GroupTitle>
          <Row
            label={t("settings.system.notifyNewContent")}
            hint={t("settings.system.notifyNewContentHint")}
          >
            <Toggle
              ariaLabel={t("settings.system.notifyNewContent")}
              checked={s.fanoutNewContent}
              onChange={(v) => patch("fanoutNewContent", v)}
            />
          </Row>
          <Row label={t("settings.system.notifyComments")}>
            <Toggle
              ariaLabel={t("settings.system.notifyComments")}
              checked={s.notifyComments}
              onChange={(v) => patch("notifyComments", v)}
            />
          </Row>
          <Row label={t("settings.system.bellPoll")}>
            <NumberField
              ariaLabel={t("settings.system.bellPoll")}
              value={s.bellPollSec}
              min={10}
              max={600}
              onChange={(v) => patch("bellPollSec", v)}
            />
          </Row>
        </div>
      </>
    );
  },
);

export default SystemSection;
